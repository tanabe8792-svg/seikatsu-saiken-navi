/**
 * 車・免許まわりの被災者向け手続き（熊本・参考）
 * 罹災証明（り災証明）が入口になることが多い。
 */

export interface VehicleReliefLink {
  label: string;
  href: string;
}

export interface VehicleReliefItem {
  id: string;
  title: string;
  body: string;
  needsCertificate: boolean;
  links: VehicleReliefLink[];
}

/** 罹災証明のやること項目 ID */
export const CERT_PREP_ACTION_ID = "rw-j03-cert-prep";

export const VEHICLE_DISASTER_RELIEF_ITEMS: VehicleReliefItem[] = [
  {
    id: "police-fees",
    title: "運転免許・車庫証明などの手数料免除（熊本県警）",
    body: "被災して使えなくなった車の代替、免許証の再交付などで、各種手数料が免除される案内があります（令和8年熊本地震）。申請には、り災証明書など被災した事実が分かる書類が必要です。車庫証明の電子申請（ワンストップ）は対象外と案内されています。",
    needsCertificate: true,
    links: [
      {
        label: "熊本県：被災者支援の案内（最新を確認）",
        href: "https://www.pref.kumamoto.jp/soshiki/27/274885.html",
      },
    ],
  },
  {
    id: "auto-tax",
    title: "自動車税の減免・免除（熊本県）",
    body: "被災した自動車について、使用不能や大きな損害がある場合、自動車税（種別割・環境性能割）の減免・免除を受けられることがあります。申請には「罹災証明書」または「被災証明書」と、被災後の写真などが必要になることが多いです。期限や書類は公式案内を正としてください。",
    needsCertificate: true,
    links: [
      {
        label: "熊本県：自動車が水没された方への税の減免",
        href: "https://www.pref.kumamoto.jp/kiji_34509.html",
      },
      {
        label: "熊本県：災害による県税減免等（PDF）",
        href: "https://www.pref.kumamoto.jp/uploaded/attachment/291795.pdf",
      },
    ],
  },
];

export const VEHICLE_RELIEF_INTRO =
  "住まいの罹災証明（り災証明）のほか、車が使えなくなった・免許や車庫の手続きが必要な場合も、被災の証明書類が入口になることがあります。先に罹災証明の申請を進められると、あとがスムーズです。";
