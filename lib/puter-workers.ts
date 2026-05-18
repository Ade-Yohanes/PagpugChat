import puter from "@heyputer/puter.js";

/** Matches Puter docs: WorkerInfo */
export type WorkerInfo = {
  name: string;
  url: string;
  file_path: string;
  file_uid: string;
  created_at: string;
};

/** Matches Puter docs: WorkerDeployment */
export type WorkerDeployment = {
  success: boolean;
  url: string;
  errors: unknown[];
};

export async function listWorkers(): Promise<WorkerInfo[]> {
  return puter.workers.list() as Promise<WorkerInfo[]>;
}

export async function getWorker(workerName: string): Promise<WorkerInfo | undefined> {
  return puter.workers.get(workerName) as Promise<WorkerInfo | undefined>;
}

export async function deleteWorker(workerName: string): Promise<boolean> {
  return puter.workers.delete(workerName) as Promise<boolean>;
}

export async function createWorkerFromPath(
  workerName: string,
  filePath: string
): Promise<WorkerDeployment> {
  return puter.workers.create(workerName, filePath) as Promise<WorkerDeployment>;
}

export async function execWorker(
  workerURL: string,
  options?: RequestInit
): Promise<Response> {
  return puter.workers.exec(workerURL, options) as Promise<Response>;
}

/**
 * Writes source to Puter FS, then deploys the worker from that path.
 */
export async function deployWorkerFromSource(
  workerName: string,
  sourceCode: string,
  fileName: string
): Promise<WorkerDeployment> {
  await puter.fs.write(fileName, sourceCode);
  return createWorkerFromPath(workerName, fileName);
}
