const { spawn } = require('child_process');

function runSSHCommand(cmd) {
  return new Promise((resolve) => {
    const ssh = spawn('ssh', ['-o', 'StrictHostKeyChecking=no', 'root@srv1941445.hstgr.cloud', cmd]);
    let out = '', err = '';
    ssh.stdout.on('data', d => {
      out += d.toString();
      console.log('STDOUT:', d.toString());
    });
    ssh.stderr.on('data', d => {
      const str = d.toString();
      err += str;
      console.log('STDERR:', str);
      if (str.toLowerCase().includes('password')) {
        ssh.stdin.write('Naziha-070962\n');
      }
    });
    ssh.on('close', code => resolve({ code, out, err }));
  });
}

async function main() {
  console.log("=== CHECKING VPS DIRECTORY & DOCKER STATUS ===");
  await runSSHCommand("cd /var/www/sudokugame24 && git status");
  
  console.log("=== PULLING LATEST CHANGES FROM MAIN ===");
  await runSSHCommand("cd /var/www/sudokugame24 && git pull origin main");

  console.log("=== REBUILDING AND RESTARTING WEB CONTAINER ===");
  await runSSHCommand("cd /var/www/sudokugame24 && docker compose -f docker-compose.prod.yml build --no-cache web && docker compose -f docker-compose.prod.yml up -d --no-deps web");

  console.log("=== CHECKING RUNNING CONTAINERS ===");
  await runSSHCommand("docker ps");
}

main();
