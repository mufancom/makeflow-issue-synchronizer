export type ISSUE_SYNCHRONIZER_TYPE = typeof issueSynchronizerTypes[number];

export const issueSynchronizerTypes = ['github', 'gitlab'] as const;
