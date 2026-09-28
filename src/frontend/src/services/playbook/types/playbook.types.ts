export interface Playbook {
  id: number;
  code: string;
  title: string;
}

export interface PlaybookExecution {
  id: number;
  playbookId: number;
  status: string;
  log: string;
}
