import * as fs from 'fs';
import * as path from 'path';

export class ForensicLogger {
  private logFilePath: string;

  constructor(filename: string) {
    this.logFilePath = path.join(
      __dirname,
      '..',
      'test-results',
      'phase-7.5-final',
      filename,
    );
    // Clear the file on start
    if (fs.existsSync(this.logFilePath)) {
      fs.writeFileSync(this.logFilePath, '');
    }
  }

  log(message: string) {
    const ts = new Date().toISOString();
    const formatted = `[${ts}] ${message}\n`;
    fs.appendFileSync(this.logFilePath, formatted);
    console.log(formatted.trim());
  }

  logTestStart(testName: string) {
    this.log(`\n==================================================`);
    this.log(`TEST START: ${testName}`);
    this.log(`==================================================`);
  }

  logRequest(method: string, endpoint: string, body?: any) {
    this.log(`REQUEST: ${method} ${endpoint}`);
    if (body) this.log(`PAYLOAD: ${JSON.stringify(body)}`);
  }

  logResponse(status: number, body: any) {
    this.log(`RESPONSE STATUS: ${status}`);
    this.log(`RESPONSE BODY: ${JSON.stringify(body)}`);
  }

  logDBAssertion(table: string, assertion: string, passed: boolean) {
    this.log(`DB ASSERTION [${table}]: ${assertion} -> ${passed ? 'PASS' : 'FAIL'}`);
  }

  logResult(testName: string, passed: boolean) {
    this.log(`\nTEST RESULT: ${testName} -> ${passed ? '🟢 PASS' : '🔴 FAIL'}`);
    this.log(`==================================================\n`);
  }

  async runTest(testName: string, testFn: () => Promise<void>) {
    this.logTestStart(testName);
    try {
      await testFn();
      this.logResult(testName, true);
    } catch (err: any) {
      this.log(`TEST CRASHED: ${err.message}`);
      if (err.response) {
        this.logResponse(err.response.status, err.response.data);
      } else {
        this.log(err.stack);
      }
      this.logResult(testName, false);
      throw err; // Re-throw to stop suite if needed, or catch in suite
    }
  }
}
