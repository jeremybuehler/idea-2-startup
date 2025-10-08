export interface IdeaScores {
  total: number;
  desirability: number;
  feasibility: number;
  viability: number;
  defensibility: number;
  timing: number;
}

export interface Brief {
  title: string;
  one_liner: string;
  idea_text: string;
}

export interface Dossier {
  id: string;
  created_at: string;
  idea_text: string;
  title: string;
  one_liner: string;
  scores: IdeaScores;
  prd: string;
  runbook: string;
  repo: string;
  api: string;
  server?: any;
}

export interface PipelineStage {
  icon: React.ReactNode;
  label: string;
}

// Window interface extension for self-tests
declare global {
  // eslint-disable-next-line no-unused-vars
  interface Window {
    __LAUNCHLOOM_TESTED__?: boolean;
  }
}
