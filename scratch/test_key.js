const { spawn } = require('child_process');

function runSSHWithBatchMode() {
  return new Promise((resolve) => {
    const ssh = spawn('ssh', ['-o', 'BatchMode=yes', '-o', 'StrictHostKeyChecking=no', '-o', 'ConnectTimeout=5', 'root@179.198.195.47', 'docker ps']);
    let out = '', err = '';
    ssh.stdout.on('data', d => out += d);
    ssh.stderr.on('data', d => err += d);
    ssh.on('close', code => resolve({ code, out, err }));
  });
}

runSSHWithBatchMode().then(console.log);
