export type UserRole = "super_admin" | "admin" | "placarista" | "lider";

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  role: UserRole;
  created_at: string;
}

export interface Campeonato {
  id: number;
  nome: string;
  ano: number;
  status: "ativo" | "arquivado";
  criado_em: string;
  criado_por_id: string;
  regioes?: Regiao[];
}

export interface Regiao {
  id: number;
  campeonato_id: number;
  nome: string;
  descricao?: string;
}

export type Modalidade = "Futebol Masculino" | "Futebol Feminino" | "Volei Misto";

export interface Time {
  id: number;
  campeonato_id: number;
  nome_igreja: string;
  distrito?: string;
  regiao?: string;
  nome_base?: string;
  modalidade: Modalidade;
  token: string;
  lider_id: string;
  imagem_url?: string;
  link_pagamento?: string;
  pagou: boolean;
  comprovante_url?: string;
  diretor_jovem?: string;
  cadastros_encerrados: boolean;
  limite_nao_adv_fut_masc?: number;
  limite_nao_adv_fut_fem?: number;
  limite_nao_adv_volei_misto?: number;
  created_at?: string;
  // Relations
  jogadores?: Jogador[];
  classificacao?: Classificacao;
  grupo?: Grupo;
}

export interface Jogador {
  id: number;
  campeonato_id: number;
  time_id: number;
  nome_completo: string;
  cpf?: string;
  rg?: string;
  data_nascimento?: string;
  telefone: string;
  is_adventista: boolean;
  is_capitao: boolean;
  foto_url?: string;
  foto_identidade_url?: string;
  time?: Time;
}

export interface Grupo {
  id: number;
  campeonato_id: number;
  nome: string;
  modalidade: Modalidade;
  times?: Time[];
  classificacao?: Classificacao[];
}

export interface Classificacao {
  id: number;
  campeonato_id: number;
  time_id: number;
  grupo_id: number;
  jogos_disputados: number;
  vitorias: number;
  empates: number;
  derrotas: number;
  gols_pro: number;
  gols_contra: number;
  time?: Time;
  grupo?: Grupo;
}

export interface Game {
  id: number;
  campeonato_id: number;
  modalidade: Modalidade;
  fase?: string;
  data_hora?: string;
  local?: string;
  finalizado: boolean;
  ordem_na_fase?: number;
  time_a_id?: number;
  time_b_id?: number;
  vencedor_id?: number;
  gols_time_a?: number;
  gols_time_b?: number;
  sets_vencidos_a?: number;
  sets_vencidos_b?: number;
  pontos_sets?: string;
  proximo_jogo_id?: number;
  time_a?: Time;
  time_b?: Time;
  vencedor?: Time;
}

export interface Configuracao {
  id: number;
  campeonato_id: number;
  cadastros_globais_encerrados: boolean;
  num_quadras_fut_masc: number;
  num_quadras_fut_fem: number;
  num_quadras_volei_misto: number;
  limite_nao_adv_fut_masc: number;
  limite_nao_adv_fut_fem: number;
  limite_nao_adv_volei_misto: number;
}
