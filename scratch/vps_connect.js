const { spawn } = require('child_process');

function execSSH(cmd) {
  return new Promise((resolve, reject) => {
    const ssh = spawn('ssh', ['-o', 'StrictHostKeyChecking=no', '-o', 'ConnectTimeout=10', 'root@179.198.195.47', cmd]);
    let stdout = '';
    let stderr = '';

    ssh.stdout.on('data', (data) => stdout += data.toString());
    ssh.stderr.on('data', (data) => {
      const str = data.toString();
      stderr += str;
      if (str.toLowerCase().includes('password')) {
        ssh.stdin.write('Naziha-070962\n');
      }
    });

    ssh.on('close', (code) => {
      resolve({ code, stdout, stderr });
    });
  });
}

async function run() {
  console.log('Testing SSH connection...');
  const res = await execSSH('pwd; ls -la; docker ps');
  console.log('Code:', res.code);
  console.log('Stdout:\n', res.stdout);
  console.log('Stderr:\n', res.stderr);
}

run();
