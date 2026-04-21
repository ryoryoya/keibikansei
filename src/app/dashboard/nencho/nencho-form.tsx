"use client";

import { useState } from "react";
import { NenchoDeclarations, NenchoDependent } from "./nencho-types";

type Props = {
  declarations: NenchoDeclarations;
  readOnly: boolean;
  onSave: (decl: NenchoDeclarations) => void;
};

function NumInput({ value, onChange, readOnly }: { value: number; onChange: (v: number) => void; readOnly: boolean }) {
  return (
    <input
      type="number"
      min={0}
      value={value || ""}
      onChange={(e) => onChange(Number(e.target.value) || 0)}
      readOnly={readOnly}
      className={`input text-right ${readOnly ? "bg-gray-50 text-gray-500" : ""}`}
    />
  );
}

export function NenchoForm({ declarations, readOnly, onSave }: Props) {
  const [d, setD] = useState<NenchoDeclarations>(declarations);

  function set<K extends keyof NenchoDeclarations>(key: K, value: NenchoDeclarations[K]) {
    setD((prev) => ({ ...prev, [key]: value }));
  }

  function addDependent() {
    const dep: NenchoDependent = { id: `dep-${Date.now()}`, name: "", relationship: "子", birthDate: "", income: 0 };
    setD((prev) => ({ ...prev, dependents: [...prev.dependents, dep] }));
  }

  function updateDependent(id: string, patch: Partial<NenchoDependent>) {
    setD((prev) => ({ ...prev, dependents: prev.dependents.map((dep) => dep.id === id ? { ...dep, ...patch } : dep) }));
  }

  function removeDependent(id: string) {
    setD((prev) => ({ ...prev, dependents: prev.dependents.filter((dep) => dep.id !== id) }));
  }

  return (
    <div className="bg-white rounded-xl border overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b">
        <h3 className="text-sm font-bold text-gray-700">申告内容</h3>
        {readOnly && <p className="text-xs text-gray-400 mt-0.5">完了済みのため編集不可</p>}
      </div>
      <div className="px-4 py-4 space-y-5">

        {/* 配偶者 */}
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-2">配偶者控除</label>
          <div className="flex gap-3">
            {([{ val: true, label: "あり" }, { val: false, label: "なし" }] as const).map(({ val, label }) => (
              <button
                key={label}
                type="button"
                disabled={readOnly}
                onClick={() => set("hasSpouse", val)}
                className={`flex-1 py-2 text-sm font-medium rounded-xl border-2 transition-all ${
                  d.hasSpouse === val
                    ? "border-brand-500 bg-brand-50 text-brand-700"
                    : "border-gray-200 text-gray-400"
                } ${readOnly ? "cursor-default opacity-70" : ""}`}
              >
                {label}
              </button>
            ))}
          </div>
          {d.hasSpouse && (
            <div className="mt-2">
              <label className="block text-xs text-gray-500 mb-1">配偶者の所得金額（円）</label>
              <NumInput value={d.spouseIncome} onChange={(v) => set("spouseIncome", v)} readOnly={readOnly} />
            </div>
          )}
        </div>

        {/* 扶養親族 */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-gray-600">扶養親族</label>
            {!readOnly && (
              <button onClick={addDependent} type="button"
                className="text-xs text-brand-500 hover:text-brand-700 font-medium">
                ＋ 追加
              </button>
            )}
          </div>
          {d.dependents.length === 0 ? (
            <p className="text-xs text-gray-400">扶養親族なし</p>
          ) : (
            <div className="space-y-2">
              {d.dependents.map((dep) => (
                <div key={dep.id} className="bg-gray-50 rounded-lg p-3 text-xs space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-gray-500 block mb-0.5">氏名</span>
                      <input value={dep.name} readOnly={readOnly}
                        onChange={(e) => updateDependent(dep.id, { name: e.target.value })}
                        className="input text-xs" />
                    </div>
                    <div>
                      <span className="text-gray-500 block mb-0.5">続柄</span>
                      <input value={dep.relationship} readOnly={readOnly}
                        onChange={(e) => updateDependent(dep.id, { relationship: e.target.value })}
                        className="input text-xs" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-gray-500 block mb-0.5">生年月日</span>
                      <input type="date" value={dep.birthDate} readOnly={readOnly}
                        onChange={(e) => updateDependent(dep.id, { birthDate: e.target.value })}
                        className="input text-xs" />
                    </div>
                    <div>
                      <span className="text-gray-500 block mb-0.5">所得（円）</span>
                      <input type="number" min={0} value={dep.income || ""} readOnly={readOnly}
                        onChange={(e) => updateDependent(dep.id, { income: Number(e.target.value) || 0 })}
                        className="input text-xs text-right" />
                    </div>
                  </div>
                  {!readOnly && (
                    <button onClick={() => removeDependent(dep.id)} type="button"
                      className="text-red-400 hover:text-red-600 text-[10px]">削除</button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 保険料控除 */}
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-2">保険料控除</label>
          <div className="space-y-2">
            <div>
              <label className="text-xs text-gray-500 block mb-0.5">生命保険料控除申告額（円）</label>
              <NumInput value={d.lifeInsurance} onChange={(v) => set("lifeInsurance", v)} readOnly={readOnly} />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-0.5">地震保険料控除（円）</label>
              <NumInput value={d.earthquakeInsurance} onChange={(v) => set("earthquakeInsurance", v)} readOnly={readOnly} />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-0.5">住宅ローン控除（円）</label>
              <NumInput value={d.housingLoan} onChange={(v) => set("housingLoan", v)} readOnly={readOnly} />
            </div>
          </div>
        </div>

        {/* 前職情報 */}
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-2">前職情報</label>
          <div className="space-y-2">
            <div>
              <label className="text-xs text-gray-500 block mb-0.5">前職給与収入（円）</label>
              <NumInput value={d.previousEmployerPay} onChange={(v) => set("previousEmployerPay", v)} readOnly={readOnly} />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-0.5">前職源泉徴収税額（円）</label>
              <NumInput value={d.previousEmployerTax} onChange={(v) => set("previousEmployerTax", v)} readOnly={readOnly} />
            </div>
          </div>
        </div>

        {!readOnly && (
          <button
            type="button"
            onClick={() => onSave(d)}
            className="w-full py-3 bg-brand-500 text-white font-bold text-sm rounded-xl hover:bg-brand-600 transition-colors"
          >
            保存・再計算
          </button>
        )}
      </div>
    </div>
  );
}
