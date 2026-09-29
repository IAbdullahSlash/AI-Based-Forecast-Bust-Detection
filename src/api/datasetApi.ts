export interface DatasetStatus {
  available: boolean;
  fileCount: number;
  initializations: string[];
  forecastDays: number[];
  variables: string[];
  observationDataAvailable: boolean;
  readyForBustEvaluation: boolean;
}

export async function fetchDatasetStatus(): Promise<DatasetStatus> {
  const response = await fetch('/api/dataset/status');
  if (!response.ok) throw new Error('Unable to read the local dataset catalogue.');
  return response.json();
}
