export interface Installation {
  organization: string;
  installation: string;
  makeflowBaseURL: string;
  active?: boolean;
  accessToken?: string;
}

export interface InstallationIdentity {
  organization: string;
  installation: string;
}
