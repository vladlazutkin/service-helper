import { spawnSync } from 'child_process';

export const execPythonScript = async (path: string, args: string[] = []) => {
  const pythonProcess = await spawnSync('python3', [path, ...args]);

  const result = pythonProcess.stdout?.toString()?.trim();
  const error = pythonProcess.stderr?.toString()?.trim();

  if (error) {
    console.log('Error from python script', error);
    throw new Error('Error execution python script');
  }

  return result;
};
