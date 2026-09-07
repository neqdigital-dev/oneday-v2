import { type ClassValue, clsx } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return inputs.filter(Boolean).join(" ");
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("pt-BR");
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return "—";
  return new Date(date).toLocaleString("pt-BR");
}

export function calcularIdade(dataNascimento: string, dataRef?: Date): number {
  const ref = dataRef || new Date();
  const nasc = new Date(dataNascimento);
  let age = ref.getFullYear() - nasc.getFullYear();
  const m = ref.getMonth() - nasc.getMonth();
  if (m < 0 || (m === 0 && ref.getDate() < nasc.getDate())) age--;
  return age;
}

export function getPontosClassificacao(vitorias: number, empates: number): number {
  return vitorias * 3 + empates;
}

export function getSaldoGols(gols_pro: number, gols_contra: number): number {
  return gols_pro - gols_contra;
}

export function generateToken(): string {
  return crypto.randomUUID();
}

export function getModalidadeShort(modalidade: string): string {
  if (modalidade === "Futebol Masculino") return "FUT-M";
  if (modalidade === "Futebol Feminino") return "FUT-F";
  if (modalidade === "Volei Misto") return "VOL";
  return modalidade;
}

export function getModalidadeColor(modalidade: string): string {
  if (modalidade === "Futebol Masculino") return "blue";
  if (modalidade === "Futebol Feminino") return "pink";
  if (modalidade === "Volei Misto") return "orange";
  return "gray";
}
