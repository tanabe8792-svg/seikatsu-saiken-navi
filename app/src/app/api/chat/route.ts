import { NextResponse } from "next/server";
import OpenAI from "openai";
import type { ActionItem } from "@/lib/types";
import { OPENAI_MODEL } from "@/lib/constants";
import {
  buildCaseWorkerSystemMessage,
  applyKnowledgeToFallbackMessage,
} from "@/lib/knowledge/prompt";
import { buildFallbackReply, extractJsonBlock } from "@/lib/chat";
import {
  mergeChatProfileFromMessages,
  sanitizeChatReplyAgainstDuplicateQuestions,
} from "@/lib/chat-profile";
import { profileToCaseProfileExtras, J00_DISASTER_TYPE } from "@/lib/j00-hearing";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { generateDefaultActions, mergeActions } from "@/lib/procedures";
import {
  parseChatRequestBody,
  sanitizeActionItems,
  sanitizeUserProfile,
} from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const rate = checkRateLimit(ip);

    if (!rate.allowed) {
      return NextResponse.json(
        { error: "リクエストが多すぎます。しばらく待ってから再度お試しください。" },
        {
          status: 429,
          headers: {
            "Retry-After": String(
              Math.ceil((rate.resetAt - Date.now()) / 1000)
            ),
          },
        }
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "リクエスト形式が正しくありません" },
        { status: 400 }
      );
    }

    const parsed = parseChatRequestBody(body);
    if (!parsed) {
      return NextResponse.json(
        { error: "メッセージの形式またはサイズが不正です" },
        { status: 400 }
      );
    }

    const { messages, profile: rawProfile, existingActions } = parsed;
    const profile = sanitizeUserProfile({
      ...rawProfile,
      disasterType: rawProfile.disasterType ?? J00_DISASTER_TYPE,
    });
    const caseExtras = profileToCaseProfileExtras(profile);
    const systemMessage = buildCaseWorkerSystemMessage(profile, caseExtras);
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      const fallback = buildFallbackReply(messages, profile);
      let actions = fallback.actions;

      if (!actions && fallback.isComplete) {
        actions = generateDefaultActions(fallback.profile);
      }

      if (actions) {
        actions = mergeActions(existingActions, actions);
      }

      const replyMessage = sanitizeChatReplyAgainstDuplicateQuestions(
        applyKnowledgeToFallbackMessage(
          fallback.message,
          fallback.profile,
          caseExtras
        ),
        fallback.profile
      );

      return NextResponse.json({
        message: replyMessage,
        profile: fallback.profile,
        actions,
        isComplete: fallback.isComplete ?? false,
        usedFallback: true,
      });
    }

    const openai = new OpenAI({ apiKey });

    const completion = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      temperature: 0.4,
      messages: [
        { role: "system", content: systemMessage },
        ...messages.map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
      ],
    });

    const rawContent = completion.choices[0]?.message?.content ?? "";
    const { text, data } = extractJsonBlock(rawContent);

    const mergedProfile = sanitizeUserProfile({
      ...sanitizeUserProfile(data?.profile ?? {}),
      ...mergeChatProfileFromMessages(profile, messages),
      disasterType: J00_DISASTER_TYPE,
    });

    const replyText = sanitizeChatReplyAgainstDuplicateQuestions(
      text || "状況を確認しました。",
      mergedProfile
    );

    let actions: ActionItem[] | undefined;
    if (data?.actions?.length) {
      actions = sanitizeActionItems(
        data.actions.map((action) => ({ ...action, completed: false }))
      );
    } else if (data?.isComplete) {
      actions = generateDefaultActions(mergedProfile);
    }

    if (actions) {
      actions = mergeActions(existingActions, actions);
    }

    return NextResponse.json({
      message: replyText,
      profile: mergedProfile,
      actions,
      isComplete: data?.isComplete ?? Boolean(actions?.length),
      usedFallback: false,
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      {
        error:
          "AIとの通信中にエラーが発生しました。時間をおいて再度お試しください。",
      },
      { status: 500 }
    );
  }
}
