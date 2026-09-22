"use client";
export default function PrintButton({ text = "🖨️ Imprimir Chaveamento" }: { text?: string }) {
  return (
    <button className="btn btn-secondary no-print" style={{ marginLeft: "auto" }} onClick={() => window.print()}>
      {text}
    </button>
  );
}
