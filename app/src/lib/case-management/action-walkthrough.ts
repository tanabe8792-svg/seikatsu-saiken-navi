/**
 * Action 伴走ガイド — 表示専用（ActionQueue / KB 生成は変更しない）
 * 「公式リンクだけ」ではなく、何を・なぜ・どう進めるかを手順と準備物で示す。
 */

export interface WalkthroughStep {
  id: string;
  title: string;
  body: string;
  /** メモ欄の見出し（例: いつ・どこで申請するか） */
  memoLabel?: string;
  /** メモ入力のプレースホルダ */
  memoPlaceholder?: string;
  /** タップでメモに入れられる候補 */
  memoChoices?: string[];
}

export interface WalkthroughPrepItem {
  /** DocumentRequirement.id と一致する場合は DocumentRecord と連携 */
  requirementId?: string;
  label: string;
  howTo: string;
  /** unknown / 公式確認のみ */
  optional?: boolean;
}

export interface ActionWalkthrough {
  actionId: string;
  /** ひとことで何をするか */
  plainTitle: string;
  /** 制度・手続きの解説（伴走の本体） */
  explanation: string;
  /** なぜ今やるか */
  whyNow: string;
  /** 手を動かす手順（完了条件に含む） */
  steps: WalkthroughStep[];
  /**
   * 申請後など、手続き全体の進み具合（完了条件には含めない）
   * 生活再建までの進捗管理用
   */
  followUpSteps?: WalkthroughStep[];
  /** 準備物（チェックして完了できる） */
  prepItems: WalkthroughPrepItem[];
  /** この手順を終えたあとに起きること */
  afterThis: string;
  /** よくあるつまずき */
  tip?: string;
  /** 安全上の注意（表示を強める） */
  safetyCaution?: string;
}

const GUIDES: Record<string, ActionWalkthrough> = {
  "rw-j03-photo": {
    actionId: "rw-j03-photo",
    plainTitle: "住まいの様子を写真に残す",
    explanation:
      "被害の様子を写真に残しておくと、あとから保険・窓口・修理の相談で説明しやすくなります。これは申請そのものではなく、「記録を残す」ための手順です。申請の準備や進捗は、やること一覧のほかの項目で進めます。",
    whyNow:
      "修理や片付けの前に、いまの様子を残しておくと安心です。やること一覧の最初に置いているのは、写真を先に残すためです。何度でも追加撮影できます。",
    safetyCaution:
      "立っているように見えても、時間差で倒壊・落下する建物があります。傾き・大きな亀裂・異音がある建物には近づかず、無理に中へ入らないでください。写真は安全な場所から撮れる範囲で十分です。命と怪我のないことが最優先です。",
    steps: [
      {
        id: "photo-plan",
        title: "何を撮るか・安全を確認する",
        body: "外観（できるだけ複数方向）と、壊れた場所（壁・屋根の見える範囲・雨漏り跡など）を残します。屋根への登攀や、傾いた建物の内部は撮らないでください。危険な場所は「危険で未撮影」とメモすれば十分です。",
        memoLabel: "メモ",
        memoPlaceholder: "例: 南面の外壁に亀裂／屋根は下から見た",
        memoChoices: [
          "外観を残す",
          "損傷箇所を残す",
          "危険で近づけない場所がある",
        ],
      },
      {
        id: "photo-order",
        title: "撮る順番を決める",
        body: "①建物の外観 → ②壊れた場所、の順が分かりやすいです。暗い場所は明かりを使ってください。手順にチェックを付けたあと、「カメラへ進む」から撮影できます。撮った写真はこの端末に自動で残ります。",
        memoLabel: "メモ",
        memoPlaceholder: "例: 外観から撮る／雨漏りの跡を撮る",
        memoChoices: ["外観から撮る", "損傷から撮る", "いま安全な範囲だけ撮る"],
      },
    ],
    followUpSteps: [
      {
        id: "photo-after-rain",
        title: "雨のあと、被害が広がっていないか見た",
        body: "雨や台風のあと、雨漏りや壁の傷みが増えていないか、安全な場所から確認し、増えた分も写真に残します。",
        memoLabel: "雨のあと確認",
        memoPlaceholder: "例: 雨後に染みが広がった／危険で近づけず",
        memoChoices: [
          "被害が広がった",
          "変化はなさそう",
          "危険で近づけなかった",
          "まだ雨が来ていない",
        ],
      },
    ],
    prepItems: [],
    afterThis:
      "写真を残せたら、この項目を完了にして大丈夫です。あとから追加撮影もできます。次は罹災証明など、やること一覧のほかの項目へ進めます。",
    tip: "日付が分かるとより安心です。余震や天候のあとも、建物の様子が変わっていないか、安全な距離から確認してください。",
  },
  "rw-j03-cert-prep": {
    actionId: "rw-j03-cert-prep",
    plainTitle: "罹災証明書の申請",
    explanation:
      "罹災証明書は、市町村が「住家の被害の程度」を公的に証明する書類です。生活再建の支援金や、保険・自治体手続きの入口になります。「半壊」「一部損壊」などの判定が付きます。申請はお住まいの市町村の窓口、またはオンライン申請で行います。",
    whyNow:
      "支援制度の多くが、この証明書（または申請中であること）を前提にしています。ただし受付期間は市町村ごとで、避難中や状況整理の途中でも焦らなくて大丈夫です。安全が取れてから、公式の受付案内を一緒に確認しましょう。",
    steps: [
      {
        id: "cert-understand",
        title: "何のための書類かを把握する",
        body: "被害の「程度」を市町村が認定するための書類です。自分で被害判定を書くものではありません。申請後に調査・判定があり、結果が届きます。",
        memoLabel: "自分用のメモ",
        memoPlaceholder: "例: 半壊の認定が必要／保険会社から求められた",
        memoChoices: [
          "支援金の申請に必要",
          "保険の手続きに必要",
          "自治体から案内された",
        ],
      },
      {
        id: "cert-flow",
        title: "進み方の流れを確認する",
        body: "①このページで手順を読む → ②準備物を揃えてチェック → ③下の「申請案内」からオンラインまたは窓口で申請 → ④結果を待つ、の順です。市町村は上で選ぶと、申請方法が分かります。",
        memoLabel: "いつ申請するか",
        memoPlaceholder: "例: 8/10 午前・本庁／オンラインで申請予定",
        memoChoices: [
          "オンラインで申請する",
          "本庁窓口で申請する",
          "支所・出張所で申請する",
          "日程はこれから決める",
        ],
      },
    ],
    followUpSteps: [
      {
        id: "cert-after-wait-survey",
        title: "いま待っていること：調査・判定の連絡",
        body: "申請後は、市町村から現地調査や判定の案内が届くのを待ちます。発災直後は混雑で日数が読めないことが多いです。催促せず、受付番号と連絡手段（電話・郵送・自治体のマイページ）を控えて待ちましょう。待つあいだにできる写真・保険連絡などは進めて大丈夫です。",
        memoLabel: "連絡のメモ",
        memoPlaceholder: "例: 調査予定 8/20・電話で案内あり",
        memoChoices: [
          "調査の案内が届いた",
          "まだ連絡はない（待ち中）",
          "問い合わせ先を控えた",
        ],
      },
      {
        id: "cert-after-survey-done",
        title: "現地調査・確認があった",
        body: "調査員の訪問や書類確認がある場合があります。立ち会いが必要なときは、日時をメモしておきましょう。窓口から「もう一度来てほしい」「書類を出してほしい」など指示があれば、それに従ってください。",
        memoLabel: "調査の記録",
        memoPlaceholder: "例: 8/20 10時・立ち会い済み",
        memoChoices: [
          "調査が終わった",
          "立ち会いが必要",
          "不在票が届いた",
        ],
      },
      {
        id: "cert-after-received",
        title: "罹災証明書を受け取った",
        body: "交付方法は窓口受取・郵送・電子など自治体により異なります。受け取ったら判定内容（全壊・半壊など）を確認し、保管します。まだ届かないあいだは「待ち中」のままで大丈夫です。",
        memoLabel: "交付の記録",
        memoPlaceholder: "例: 8/28受取・半壊・控えを写真保存",
        memoChoices: [
          "窓口で受け取った",
          "郵送で届いた",
          "電子で確認した",
          "判定内容を控えた",
        ],
      },
      {
        id: "cert-after-use-next",
        title: "次の支援・手続きに使う準備をした",
        body: "証明書は生活再建支援金、保険、税の減免などで使います。コピーや写真を残し、原本は大切に保管してください。",
        memoLabel: "次に使う予定",
        memoPlaceholder: "例: 保険会社へ提出／生活再建支援の申請",
        memoChoices: [
          "保険の手続きに使う",
          "生活再建支援に使う",
          "税・国保などの届出に使う",
          "コピーを用意した",
        ],
      },
    ],
    prepItems: [
      {
        label: "本人確認書類",
        howTo:
          "運転免許証、マイナンバーカード、健康保険証など。氏名・住所が分かるものを用意します。",
      },
      {
        label: "被害状況がわかる写真",
        howTo: "前の手順で撮った写真を使えるようにしておきます。印刷が必要な自治体もあります。",
      },
    ],
    afterThis:
      "申請後は調査・判定を待ちます。日数は保証できません。待つあいだも、やること一覧の「いま」から確認を続けられます。証明書が届いたら生活再建支援や保険など次の手続きに使います。",
    tip: "混雑が予想されるときは、オンライン申請や時間帯をずらす・代理申請の可否を公式案内で確認すると負担が減ります。行政への過度な催促は避け、自分で進められる確認を優先しましょう。",
  },
  "rw-j04-insurance-report": {
    actionId: "rw-j04-insurance-report",
    plainTitle: "保険会社へ被害を連絡する",
    explanation:
      "火災保険・地震保険などに入っている場合、契約している保険会社（または代理店）へ「地震で被害があった」と早めに伝えます。請求そのものより先に「事故報告・相談」の連絡が入口になることが多いです。契約内容や必要書類は会社ごとに異なります。",
    whyNow:
      "連絡が遅いと、現場確認の日程や請求の進め方で不利になる場合があります。契約が分からなくても「地震の被害相談」と伝えれば案内してもらえます。",
    steps: [
      {
        id: "ins-find",
        title: "証券・契約先を探す",
        body: "保険証券、クレジットカード付帯、勤務先団体保険、通帳引き落とし名義などから契約会社を探します。分からなければ、申請案内の損保協会ページや代理店・保険会社の総合窓口に相談します。",
        memoLabel: "契約のメモ",
        memoPlaceholder: "例: ○○損保／証券番号はこれから探す",
        memoChoices: [
          "証券が見つかった",
          "会社名だけ分かった",
          "代理店に聞く",
          "まだ分からない",
        ],
      },
      {
        id: "ins-call",
        title: "被害があったことを連絡する",
        body: "「令和8年熊本地震で住家に被害が出た」と伝え、今後の手続きと必要書類を聞きます。受付番号が付いたら控えます。下の「申請案内」から損保の公式案内も開けます。",
        memoLabel: "連絡の記録",
        memoPlaceholder: "例: 8/7連絡・受付番号1234・担当○○",
        memoChoices: [
          "保険会社に連絡した",
          "代理店に連絡した",
          "受付番号を控えた",
          "まだ連絡していない",
        ],
      },
      {
        id: "ins-ask",
        title: "次に何を出せばよいか確認する",
        body: "写真、罹災証明、見積もりなど、会社が求めるものをメモします。この場で全部出さなくてよい場合も多いです。",
        memoLabel: "必要書類メモ",
        memoPlaceholder: "例: 写真必須／罹災証明は後で可",
        memoChoices: [
          "写真を求められた",
          "罹災証明を求められた",
          "見積もりを求められた",
          "追加連絡を待つ",
        ],
      },
    ],
    followUpSteps: [
      {
        id: "ins-after-survey",
        title: "調査・査定の連絡があった",
        body: "現地調査や写真判定の案内が来たら、日時と結果をメモします。",
        memoLabel: "査定の記録",
        memoPlaceholder: "例: 8/20調査予定／写真提出済み",
        memoChoices: [
          "調査日が決まった",
          "書類を提出した",
          "結果を待っている",
        ],
      },
      {
        id: "ins-after-paid",
        title: "保険金の案内・入金があった",
        body: "支払額の案内や振込日を控えておくと、他の再建資金の計画に使えます。",
        memoLabel: "入金の記録",
        memoPlaceholder: "例: 案内額○○万／振込予定 8/30",
        memoChoices: [
          "支払案内が届いた",
          "入金を確認した",
          "追加の手続きがある",
        ],
      },
    ],
    prepItems: [
      {
        label: "保険証券または契約が分かるもの",
        howTo: "証券番号、会社名、証券の写真でも可。見当たらなくても連絡は可能です。",
      },
      {
        label: "被害写真",
        howTo: "保険会社から求められたときにすぐ出せるよう、端末に残しておきます。",
      },
    ],
    afterThis:
      "連絡後は、保険会社の案内に沿って書類提出や現地調査の日程を進めます。",
    tip: "複数契約がある場合は、それぞれに連絡が必要なことがあります。",
  },
  "rw-j04-loan-relief": {
    actionId: "rw-j04-loan-relief",
    plainTitle: "住宅ローンの負担軽減を確認する",
    explanation:
      "大きな災害のあと、住宅ローンの返済猶予や減免・条件変更を相談できる仕組みがあります（いわゆる被災ローン減免などの枠組み）。「必ず減免される」ではなく、金融機関や制度ごとに条件が違います。まずは借入先（銀行など）と、公的な案内の両方を確認する段階です。",
    whyNow:
      "ローン返済が続くと生活再建の資金繰りが厳しくなりがちです。対象かどうかを早めに知ると、次の相談先がはっきりします。",
    steps: [
      {
        id: "loan-know",
        title: "制度の位置づけを理解する",
        body: "個人の住宅ローンについて、災害時に返済条件の見直しや減免を相談する枠組みです。対象になるかは、被害の程度・ローンの種類・金融機関の対応によります。",
      },
      {
        id: "loan-lender",
        title: "借入先に「災害の相談」と伝える",
        body: "返済用口座のある銀行・金庫などの相談窓口に、被災したこととローンの相談希望を伝えます。専用ダイヤルがある場合もあります。",
      },
      {
        id: "loan-official",
        title: "公的な案内も一度見る",
        body: "自然災害の債務整理ガイドラインなど、公的な案内は下の「申請案内」から直接開けます。金融機関の説明と照らすと安心です。",
        memoLabel: "公的案内のメモ",
        memoPlaceholder: "例: ガイドラインを確認した／借入先に予約した",
        memoChoices: [
          "ガイドラインの案内を見た",
          "借入先に予約した",
          "まだ見ていない",
        ],
      },
    ],
    prepItems: [
      {
        label: "ローン契約書・返済が分かる書類",
        howTo:
          "契約書、返済予定表、残高証明書など。紛失時は借入先に再発行を相談します。",
      },
      {
        label: "罹災証明（または申請中の控え）",
        howTo:
          "まだの場合は、先に罹災証明の申請準備を進めると、相談が分かりやすく進みます。",
      },
    ],
    afterThis:
      "相談結果（猶予・条件変更・対象外など）が分かったら、生活再建の資金計画や他の支援申請とあわせて整理します。",
    tip: "返済が苦しいときは、滞納が続く前に相談した方が選択肢が残りやすいです。",
  },
  "rw-j04-life-rebuild": {
    actionId: "rw-j04-life-rebuild",
    plainTitle: "生活再建支援金の確認",
    explanation:
      "被災者生活再建支援制度は、一定以上の住家被害があった世帯に、再建のための支援金を支給する国の仕組みです。支給には市町村の罹災証明などによる被害認定が関係します。申請窓口や期限は災害・自治体の案内に従います。",
    whyNow:
      "半壊・全壊など、認定が出ると対象になる可能性があります。早めに「自分は確認すべき制度か」を把握しておくと安心です。",
    steps: [
      {
        id: "life-eligible",
        title: "対象のイメージを掴む",
        body: "住家の被害認定（全壊・大規模半壊・中規模半壊・半壊など）に応じて支援の内容が変わります。まずは罹災証明の結果が重要です。",
      },
      {
        id: "life-where",
        title: "申請の窓口・案内を確認する",
        body: "多くの場合、市町村の被災者支援窓口や案内ページで手続きが示されます。準備物を揃えたあと、下の「申請案内」から国交省の制度説明と支援ナビへ進めます。",
        memoLabel: "申請先のメモ",
        memoPlaceholder: "例: 市の被災者支援窓口／支援ナビで確認済",
        memoChoices: [
          "支援ナビを開いた",
          "市町村の窓口が分かった",
          "まだ確認中",
        ],
      },
    ],
    prepItems: [
      {
        label: "罹災証明",
        howTo: "発行前でも、申請中であることをメモしておくと相談しやすいです。",
      },
      {
        label: "所得証明",
        howTo: "住民税課税証明書など。市区町村で取得できることが多いです。",
      },
      {
        label: "振込口座の情報",
        howTo: "通帳やキャッシュカードで、名義・口座番号を確認します。",
      },
    ],
    afterThis:
      "必要書類が揃い次第、案内に沿って申請します。結果の連絡を待ちながら、仕事・学校・通院の再開見通しもメモしておくと、生活の立て直しで困りにくくなります。",
    followUpSteps: [
      {
        id: "life-after-apply",
        title: "支援金の申請をした／結果を待っている",
        body: "申請日と受付を控えます。結果が出る前でも、他の再建手続きは進められます。",
        memoLabel: "申請の記録",
        memoPlaceholder: "例: 8/20申請・市窓口／結果待ち",
        memoChoices: [
          "申請した",
          "追加書類を求められた",
          "結果を待っている",
        ],
      },
      {
        id: "life-after-restart",
        title: "仕事・学校・通院の確認をした",
        body: "支援金の手続きと別に、勤務先・学校・かかりつけへの連絡状況を整理します。判断はそれぞれの案内に従います。",
        memoLabel: "生活再開メモ",
        memoPlaceholder: "例: 勤務先に連絡済／通院は来週予約",
        memoChoices: [
          "仕事の連絡をした",
          "学校・園を確認した",
          "通院・薬を確認した",
        ],
      },
    ],
  },
  "rw-j05-emergency-repair": {
    actionId: "rw-j05-emergency-repair",
    plainTitle: "応急・緊急修理（屋根・ブルーシート）を確認する",
    explanation:
      "雨や台風の前に、屋根・外壁などの被害拡大を防ぐ「緊急の修理」（ブルーシート展張など）と、当面住むための「応急修理」があります。自治体ごとに名称・期限・手順が違います。自分で対象かどうか決めつけず、公式案内と窓口で確認します。業者と契約する前に申請の流れを見るのが大切です。",
    whyNow:
      "雨が続くと被害が広がり、あとからでは対象外や負担増になることがあります。期限のある制度も多いので、早めに確認しておくと安心です。",
    steps: [
      {
        id: "repair-risk",
        title: "いま困っていることを整理する",
        body: "屋根のずれ、雨漏り、窓・外壁の損傷など、「雨が来ると困る箇所」をメモします。写真があれば申請案内とあわせて使えます。",
        memoLabel: "困っていること",
        memoPlaceholder: "例: 屋根の瓦ずれ／寝室に雨漏り",
        memoChoices: [
          "屋根が心配",
          "雨漏りがある",
          "窓・外壁が壊れている",
          "ブルーシートが必要そう",
        ],
      },
      {
        id: "repair-check",
        title: "緊急修理・応急修理の案内を確認する",
        body: "準備物を揃えたあと、下の「申請案内」から、県のブルーシート等（緊急修理）や市の案内、支援ナビを開きます。罹災証明が不要な緊急修理もあります。対象・期限は公式の案内で確認してください。",
        memoLabel: "案内の確認メモ",
        memoPlaceholder: "例: 市の緊急修理ページを見た／期限は要確認",
        memoChoices: [
          "緊急修理（ブルーシート等）を確認した",
          "応急修理を確認した",
          "窓口の電話を控えた",
          "まだ公式を見ていない",
        ],
      },
    ],
    followUpSteps: [
      {
        id: "repair-after-apply",
        title: "申込・相談をした",
        body: "申込日、受付、業者名を控えます。完了期限がある場合はカレンダーに入れます。",
        memoLabel: "申込の記録",
        memoPlaceholder: "例: 8/8申込・業者○○・完了期限要確認",
        memoChoices: [
          "自治体に申し込んだ",
          "業者に依頼した",
          "結果・承認を待っている",
        ],
      },
      {
        id: "repair-after-done",
        title: "応急対応が終わった／次の本修繕を考え始めた",
        body: "ブルーシートや応急修理のあとは、保険・本格修繕・住まいの見直しとつなぎます。",
        memoLabel: "次の一手",
        memoPlaceholder: "例: 保険の査定待ち／本修繕の見積を取る",
        memoChoices: [
          "応急対応が完了した",
          "本修繕を検討する",
          "住まいの見直しも考える",
        ],
      },
    ],
    prepItems: [
      {
        label: "屋根・雨漏りなどが分かる写真",
        howTo: "応急・緊急修理の相談で使うことがあります。雨の前後で増えた被害も残します。",
      },
      {
        label: "罹災証明（または申請中の控え）",
        howTo:
          "応急修理では必要な場合が多いです。緊急修理（ブルーシート等）では不要な案内もあるので、公式で確認します。",
      },
    ],
    afterThis:
      "対象なら期限までに申し込み、修理の実施・報告へ進みます。対象外でも、保険や本修繕の相談材料になります。",
    tip: "「自分でブルーシートを買えばよいか」と迷ったら、先に申請案内の公式ページか窓口へ。費用負担の仕組みが違うことがあります。",
  },
  "rw-j02-water-station": {
    actionId: "rw-j02-water-station",
    plainTitle: "給水場所とライフラインを確認する",
    explanation:
      "断水中は給水所・給水車で水を確保します。あわせて、電気・ガスが止まっている場合は、各事業者の案内を確認します（ガスは匂いがしたら自分で触らず専門へ）。断水が続く・続いた場合は、あとで水道料金の減免届出を見落とさないようにします。",
    whyNow:
      "水の確保は毎日の生活に直結します。減免や開栓の手続きは後回しにすると機会を逃しやすいので、見通しだけ先に持っておきます。",
    steps: [
      {
        id: "water-find",
        title: "給水場所・時間を確認する",
        body: "下の「申請案内」から、自治体の給水情報や支援ナビを直接開けます。場所・時間・持ち物（ポリタンク等）をメモします。",
        memoLabel: "給水の予定",
        memoPlaceholder: "例: ○○小学校 9-16時／タンク持参",
        memoChoices: [
          "給水場所が分かった",
          "時間を確認した",
          "家族で分担する",
        ],
      },
      {
        id: "water-other-lifeline",
        title: "電気・ガスの安全も確認する",
        body: "停電・ガス停止がある場合は、九州電力やガス事業者の復旧・再開案内を見ます。ガス漏れの疑いがあるときは、自分で元栓操作を急がず、事業者か消防の案内に従ってください。",
        memoLabel: "電気・ガスのメモ",
        memoPlaceholder: "例: 停電中／ガスは事業者に電話予定",
        memoChoices: [
          "電気は使える",
          "停電中で案内を見た",
          "ガスは使える",
          "ガスは事業者に確認する",
        ],
      },
      {
        id: "water-rate",
        title: "水道料金の減免届出を見落とさない",
        body: "断水や被災による水道・下水道の減免がある自治体が多いです。復旧後でも届出期限があることがあります。申請案内から公式を開き、必要な届出をメモします。",
        memoLabel: "減免の確認",
        memoPlaceholder: "例: 市上下水道局に確認／届出は復旧後でも可と案内",
        memoChoices: [
          "減免案内を見た",
          "窓口に電話した",
          "届出した",
          "まだ確認していない",
        ],
      },
    ],
    followUpSteps: [
      {
        id: "water-after-restore",
        title: "通水・再開したあとの確認をした",
        body: "水が出始めたら、漏れや水質の注意、減免の届出残りがないかを確認します。",
        memoLabel: "通水後メモ",
        memoPlaceholder: "例: 8/12通水／減免届出済み",
        memoChoices: [
          "通水した",
          "減免を届け出た",
          "水漏れを確認した",
        ],
      },
    ],
    prepItems: [
      {
        label: "水を入れる容器",
        howTo: "ポリタンクや清潔なペットボトル。給水所の注意に従ってください。",
      },
    ],
    afterThis:
      "水の確保と並行して、被害写真・罹災証明など再建の入口にも進めます。減免は忘れずに。",
    tip: "子どもや高齢者がいる世帯は、水の運搬負担が大きいです。近所や支援者と分担できないか、メモしておくと安心です。",
  },
  "rw-j02-water-children": {
    actionId: "rw-j02-water-children",
    plainTitle: "子ども世帯の水と生活を確保する",
    explanation:
      "乳幼児や子どもがいる世帯は、飲み水・ミルク・衛生の確保が特に急がれます。給水場所の確認に加え、水道減免や、学校・園の再開連絡も見落とさないようにします。",
    whyNow:
      "子ども向けの水・衛生は先延ばししづらく、情報が散らばっていると見落としやすいためです。",
    steps: [
      {
        id: "water-ch-find",
        title: "給水と水の使い方を決める",
        body: "申請案内の給水情報を開き、誰が・いつ取りに行くかを決めます。ミルク・離乳食に使う水の扱いも確認します。",
        memoLabel: "分担メモ",
        memoPlaceholder: "例: 朝は自分が給水／夕方は親戚",
        memoChoices: [
          "給水場所が分かった",
          "分担を決めた",
          "ミルク用の水を確保した",
        ],
      },
      {
        id: "water-ch-rate",
        title: "水道料金の減免を確認する",
        body: "断水世帯向けの減免・猶予がないか、上下水道の公式案内で確認します。",
        memoLabel: "減免メモ",
        memoPlaceholder: "例: 届出が必要／期限は公式で確認",
        memoChoices: [
          "案内を見た",
          "届出した",
          "まだ確認していない",
        ],
      },
      {
        id: "water-ch-school",
        title: "学校・園の連絡手段を確認する",
        body: "再開や臨時休校の連絡がどこに届くか（メール・アプリ・電話）を確認し、メモします。判断は学校の案内に従います。",
        memoLabel: "学校・園メモ",
        memoPlaceholder: "例: 小学校はメール連絡／保育園に電話済み",
        memoChoices: [
          "学校・園に連絡した",
          "連絡手段を確認した",
          "まだ確認していない",
        ],
      },
    ],
    prepItems: [
      {
        label: "水を入れる容器",
        howTo: "子ども用の清潔な容器も用意できると安心です。",
      },
    ],
    afterThis:
      "水と子どもの生活の見通しが立ったら、住まいの被害記録や再建手続きにも進めます。",
    tip: "体調や衛生で心配なことがあれば、避難所・保健師・かかりつけ医の案内もあわせて確認してください。",
  },
  "rw-j04-programs": {
    actionId: "rw-j04-programs",
    plainTitle: "地域で使える支援を見渡す",
    explanation:
      "国の制度以外にも、県や市町村の独自支援、見舞金、物資、相談窓口があります。住んでいる地域の「被災者支援」まとめページや支援ナビを中心に、自分の状況に合いそうなものを書き出します。住まいだけでなく、仕事・学校・通院の再開に関係する案内も、見落としやすいので一緒にメモします。",
    whyNow:
      "制度は多いほど見落とします。一度リストアップしておくと、あとから「あれは対象だった」と後悔しにくくなります。",
    steps: [
      {
        id: "prog-list",
        title: "公式の支援一覧を開く",
        body: "下の「申請案内」から県の被災者向けポータル（支援ナビ）を開き、住居・生活・資金・心の相談などの分類をざっと見ます。",
        memoLabel: "見たページのメモ",
        memoPlaceholder: "例: 住居・生活資金の欄を見た",
        memoChoices: [
          "支援ナビを開いた",
          "住まいの支援を見た",
          "生活・資金の支援を見た",
        ],
      },
      {
        id: "prog-match",
        title: "自分の状況に合いそうなものをメモする",
        body: "被害の程度、持ち家／借家、家族構成などに触れられている制度をメモし、詳細ページで条件を確認します。対象かどうかは、公式案内と窓口で確認してください。",
        memoLabel: "気になる制度",
        memoPlaceholder: "例: 応急修理／水道減免／見舞金",
        memoChoices: [
          "応急・緊急修理が気になる",
          "水道・料金の減免が気になる",
          "住まいの支援が気になる",
          "事業の支援が気になる",
        ],
      },
      {
        id: "prog-life-restart",
        title: "仕事・学校・通院の再開も整理する",
        body: "行政が代わりに判断するものではありません。勤務先・学校・かかりつけ医の連絡先と、「いつ確認するか」だけ先に決めておくと、生活の再開で困りにくくなります。",
        memoLabel: "生活再開のメモ",
        memoPlaceholder: "例: 勤務先に8/10連絡／小学校はメール待ち／通院は来週",
        memoChoices: [
          "勤務先・仕事の連絡をする",
          "学校・園の案内を確認する",
          "通院・薬の手配を確認する",
          "まだ先でよい",
        ],
      },
    ],
    prepItems: [],
    afterThis:
      "気になる制度があれば、それぞれ申請準備や相談先をこのアプリの次の手順としても進められます。",
    tip: "「全部申請しなければ」と思わなくて大丈夫です。まずは確認した事実と次の連絡先をメモするだけで十分です。",
  },
  "rw-j04-tax-social": {
    actionId: "rw-j04-tax-social",
    plainTitle: "税・社会保険の手続きを確認する",
    explanation:
      "災害時は、所得税・住民税の軽減、国民健康保険・年金の猶予など、届出により負担を軽くできる手続きがあることがあります。内容は制度ごとに違い、期限もあります。",
    whyNow:
      "忘れやすい分野ですが、生活費に直結します。公式の「災害時の税・社会保険」案内を一度確認する価値があります。",
    steps: [
      {
        id: "tax-scan",
        title: "関係しそうな手続きを書き出す",
        body: "税務署・市町村税・国保・年金など、自分が払っているものについて災害減免・猶予の案内があるか、下の「申請案内」から確認します。",
      },
      {
        id: "tax-contact",
        title: "問い合わせ先を控える",
        body: "分からなければ、市町村の税・国保窓口や年金事務所の災害相談に「被災したので確認したい」と伝えます。",
      },
    ],
    prepItems: [],
    afterThis: "必要な届出があれば、案内に沿って書類を準備して提出します。",
  },
  "rw-j04-business-recovery": {
    actionId: "rw-j04-business-recovery",
    plainTitle: "店舗・事業の再建支援を確認する",
    explanation:
      "店舗・事業所が被災した場合、住家の手続きとは別に、中小企業・個人事業向けの相談窓口・融資・事業用り災証明があります。このページの「申請案内」から、県・市・商工会議所・公庫などの公式ページへ直接進めます。自分で検索しなくても大丈夫です。",
    whyNow:
      "営業再開の資金や仮店舗・設備復旧の話は早いほど選択肢が残ることがあります。特別相談窓口はすでに開設されています。",
    steps: [
      {
        id: "biz-damage",
        title: "事業用の被害を整理する",
        body: "店舗・設備・在庫・営業停止の状況をメモし、可能なら写真も残します。住居の写真とは分けておくと、事業用り災証明や融資相談で使いやすいです。",
        memoLabel: "被害のメモ",
        memoPlaceholder: "例: 店舗壁に亀裂／冷蔵設備停止／8/1から休業中",
        memoChoices: [
          "建物に被害あり",
          "設備・什器に被害あり",
          "在庫に被害あり",
          "休業・時短している",
        ],
      },
      {
        id: "biz-cert",
        title: "事業用り災証明が必要か確認する",
        body: "融資や補助金・保険で、店舗・事業所向けのり災証明が求められることがあります（住家の罹災証明とは別手続きの場合があります）。申請案内から自治体の案内へ進めます。",
        memoLabel: "り災証明の予定",
        memoPlaceholder: "例: 市の商業金融課で申請予定／まだ不要",
        memoChoices: [
          "事業用り災証明を申請する",
          "住家の罹災証明で足りるか確認する",
          "まだ必要か分からない",
        ],
      },
      {
        id: "biz-consult",
        title: "特別相談窓口・商工会に連絡する",
        body: "県・市の特別相談窓口、商工会議所、よろず支援拠点へ「令和8年熊本地震で店舗が被災した」と伝えます。下の申請案内のボタン・電話番号から進めます。",
        memoLabel: "相談の記録",
        memoPlaceholder: "例: 8/8 県金融相談に電話・担当○○・次回持参物あり",
        memoChoices: [
          "県の窓口に連絡した",
          "市の窓口に連絡した",
          "商工会議所に連絡した",
          "まだ連絡していない",
        ],
      },
      {
        id: "biz-finance",
        title: "融資・資金繰りの案内を確認する",
        body: "日本政策金融公庫の災害融資、県・市の制度融資、信用保証などがあります。条件は窓口で確認し、必要な書類リストをもらいます。",
        memoLabel: "資金の相談メモ",
        memoPlaceholder: "例: 公庫に相談予約／運転資金が必要",
        memoChoices: [
          "公庫の災害融資を確認する",
          "県・市の制度融資を確認する",
          "返済猶予の相談をする",
          "いまは相談のみ",
        ],
      },
    ],
    followUpSteps: [
      {
        id: "biz-after-docs",
        title: "相談で求められた書類を揃えた",
        body: "事業用り災証明、決算書、許認可、通帳など。リストをもらったらここにメモします。",
        memoLabel: "書類の進み",
        memoPlaceholder: "例: り災証明申請済／決算書は税理士に依頼",
        memoChoices: [
          "必要書類リストをもらった",
          "り災証明を申請した",
          "書類を提出した",
        ],
      },
      {
        id: "biz-after-apply",
        title: "融資・支援の申請をした",
        body: "申込日・受付番号・担当者を控えておくと、あとで問い合わせやすくなります。",
        memoLabel: "申請の記録",
        memoPlaceholder: "例: 8/15 公庫申込・受付番号なし・担当電話あり",
        memoChoices: [
          "融資を申し込んだ",
          "結果を待っている",
          "追加資料を求められた",
        ],
      },
      {
        id: "biz-after-reopen",
        title: "再開・次の一手を決めた",
        body: "仮店舗、修繕、営業再開の時期など。決まったことをメモしておくと、他の生活再建手続きとも整理しやすくなります。",
        memoLabel: "再開の見通し",
        memoPlaceholder: "例: 9月上旬再開目標／仮店舗を検討",
        memoChoices: [
          "修繕して再開する",
          "仮店舗を検討する",
          "休業を続ける",
          "方針はこれから",
        ],
      },
    ],
    prepItems: [
      {
        label: "店舗・事業所の被害が分かる写真",
        howTo:
          "外観・内装・設備。印刷が必要な窓口もあるので、端末保存に加え印刷用も想定しておくと安心です。",
      },
      {
        label: "事業所の場所が分かる地図・住所メモ",
        howTo: "事業用り災証明などで求められることがあります。",
      },
      {
        label: "本人確認書類",
        howTo: "窓口相談・申請で提示を求められることがあります。",
      },
    ],
    afterThis:
      "相談・申請が進んだら、資金の見通しと営業再開の計画を更新しつつ、住家側の再建手続きも並行できます。",
    tip: "住家のり災証明と事業用り災証明は窓口が違うことがあります。迷ったら申請案内の電話番号へ「どちらが必要か」と聞いてください。",
  },
  "rw-j05-housing": {
    actionId: "rw-j05-housing",
    plainTitle: "住まいの見直しを確認する",
    explanation:
      "応急仮設住宅やみなし仮設など、住まいの確保に関する選択肢があります。募集期間や入居条件は、県・市町村の案内で確認してください。",
    whyNow:
      "自宅での生活が難しい場合、早めに選択肢を知っておくと安心材料になります。",
    steps: [
      {
        id: "house-need",
        title: "いま必要な住まいの条件を整理する",
        body: "家族人数、ペット、通勤・通学、当面の期間など、希望を簡単に書き出します。",
      },
      {
        id: "house-option",
        title: "仮設・みなし仮設などの案内を確認する",
        body: "県・市の住まい支援は、下の「申請案内」の支援ナビから開けます。申込方法と期間を確認します。",
      },
    ],
    prepItems: [],
    afterThis: "申し込む場合は、必要書類と締切に沿って手続きします。",
  },
  "rw-j05-temp-housing": {
    actionId: "rw-j05-temp-housing",
    plainTitle: "仮設住宅などの申込を確認する",
    explanation:
      "仮設住宅の募集は期間が区切られることがあります。対象条件と必要書類を公式案内で確認し、申込漏れを防ぎます。",
    whyNow: "募集を逃すと次の機会まで待つことになる場合があります。",
    steps: [
      {
        id: "temp-period",
        title: "募集期間と対象を確認する",
        body: "下の「申請案内」から県・市町村の最新発表を開き、対象世帯と締切を確認します。",
      },
    ],
    prepItems: [
      {
        label: "申込に必要な書類",
        howTo:
          "下の「申請案内」のチェックリストに沿って準備します。罹災証明など、自治体ごとに異なります。",
      },
    ],
    afterThis: "申込後は結果連絡を待ち、入居までの生活の手配を進めます。",
  },
};

function defaultWalkthrough(actionId: string, title: string): ActionWalkthrough {
  return {
    actionId,
    plainTitle: title,
    explanation:
      "この手順では、いまの状況に合わせて確認すべきことを一緒に進めます。急がなくて大丈夫です。分かるところから進めてください。",
    whyNow: "生活再建では、順序立てて確認すると漏れや手戻りを減らせます。",
    steps: [
      {
        id: "default-read",
        title: "内容を読み、自分に当てはまるか確認する",
        body: "案内のポイントを読み、今の生活に関係ありそうかを見極めます。",
      },
      {
        id: "default-note",
        title: "分からない点をメモする",
        body: "窓口や公式案内で聞くことを1〜2個メモしておくと、次が楽です。",
      },
    ],
    prepItems: [],
    afterThis: "確認できたら、この手順を終えて次に進みます。",
  };
}

export function getActionWalkthrough(
  actionId: string,
  fallbackTitle: string
): ActionWalkthrough {
  return GUIDES[actionId] ?? defaultWalkthrough(actionId, fallbackTitle);
}

/** 手順ステップ完了の端末内保存（CaseFile 非変更） */
const WALKTHROUGH_STORAGE_KEY = "seikatsu-saiken-navi-walkthrough-v1";
const WALKTHROUGH_MEMO_KEY = "seikatsu-saiken-navi-walkthrough-memo-v1";

type WalkthroughStore = Record<string, string[]>;
type WalkthroughMemoStore = Record<string, Record<string, string>>;

function storageKey(caseId: string, actionId: string): string {
  return `${caseId}::${actionId}`;
}

/** caseId が変わっても、同じ手順のチェックが消えないようにする */
function legacyActionKey(actionId: string): string {
  return `action::${actionId}`;
}

function readStore(): WalkthroughStore {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(WALKTHROUGH_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as WalkthroughStore;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeStore(store: WalkthroughStore): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(WALKTHROUGH_STORAGE_KEY, JSON.stringify(store));
}

function readMemoStore(): WalkthroughMemoStore {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(WALKTHROUGH_MEMO_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as WalkthroughMemoStore;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeMemoStore(store: WalkthroughMemoStore): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(WALKTHROUGH_MEMO_KEY, JSON.stringify(store));
}

function mergeStepIds(...lists: Array<string[] | undefined>): string[] {
  const set = new Set<string>();
  for (const list of lists) {
    for (const id of list ?? []) set.add(id);
  }
  return [...set];
}

export function getCompletedWalkthroughSteps(
  caseId: string,
  actionId: string
): string[] {
  const store = readStore();
  return mergeStepIds(
    store[storageKey(caseId, actionId)],
    store[legacyActionKey(actionId)]
  );
}

export function setWalkthroughStepComplete(
  caseId: string,
  actionId: string,
  stepId: string,
  completed: boolean
): string[] {
  const store = readStore();
  const caseKey = storageKey(caseId, actionId);
  const actionKey = legacyActionKey(actionId);
  const current = new Set(
    mergeStepIds(store[caseKey], store[actionKey])
  );
  if (completed) current.add(stepId);
  else current.delete(stepId);
  const next = [...current];
  store[caseKey] = next;
  store[actionKey] = next;
  writeStore(store);
  return next;
}

export function getWalkthroughStepMemo(
  caseId: string,
  actionId: string,
  stepId: string
): string {
  const store = readMemoStore();
  const merged = {
    ...(store[legacyActionKey(actionId)] ?? {}),
    ...(store[storageKey(caseId, actionId)] ?? {}),
  };
  return merged[stepId] ?? "";
}

export function setWalkthroughStepMemo(
  caseId: string,
  actionId: string,
  stepId: string,
  memo: string
): void {
  const store = readMemoStore();
  const caseKey = storageKey(caseId, actionId);
  const actionKey = legacyActionKey(actionId);
  const nextForKey = {
    ...(store[caseKey] ?? {}),
    ...(store[actionKey] ?? {}),
    [stepId]: memo,
  };
  store[caseKey] = nextForKey;
  store[actionKey] = nextForKey;
  writeMemoStore(store);
}

export function appendWalkthroughMemoChoice(
  caseId: string,
  actionId: string,
  stepId: string,
  choice: string
): string {
  const current = getWalkthroughStepMemo(caseId, actionId, stepId);
  // 同じ選択肢をもう一度押したら外す（チェックの付け外し）
  if (current === choice) {
    setWalkthroughStepMemo(caseId, actionId, stepId, "");
    return "";
  }
  if (current.includes(choice)) {
    const parts = current
      .split("／")
      .map((p) => p.trim())
      .filter((p) => p && p !== choice);
    const next = parts.join("／");
    setWalkthroughStepMemo(caseId, actionId, stepId, next);
    return next;
  }
  const next = current.trim() ? `${current.trim()}／${choice}` : choice;
  setWalkthroughStepMemo(caseId, actionId, stepId, next);
  return next;
}

export function areAllWalkthroughStepsDone(
  guide: ActionWalkthrough,
  completedStepIds: string[]
): boolean {
  if (guide.steps.length === 0) return true;
  const done = new Set(completedStepIds);
  return guide.steps.every((s) => done.has(s.id));
}

/** 準備物のうち DocumentRecord 非連携分のローカル完了 */
export function getLocalPrepDoneKeys(
  caseId: string,
  actionId: string
): string[] {
  return (readStore()[storageKey(caseId, actionId)] ?? []).filter((id) =>
    id.startsWith("prep:")
  );
}

export function setLocalPrepComplete(
  caseId: string,
  actionId: string,
  prepKey: string,
  completed: boolean
): string[] {
  const stepId = prepKey.startsWith("prep:") ? prepKey : `prep:${prepKey}`;
  return setWalkthroughStepComplete(caseId, actionId, stepId, completed);
}

export function clearWalkthroughProgress(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(WALKTHROUGH_STORAGE_KEY);
  localStorage.removeItem(WALKTHROUGH_MEMO_KEY);
}
