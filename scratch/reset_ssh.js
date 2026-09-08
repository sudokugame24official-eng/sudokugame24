const { spawn } = require('child_process');

function runSSHCommand(cmd) {
  return new Promise((resolve) => {
    const ssh = spawn('ssh', ['-o', 'StrictHostKeyChecking=no', 'root@srv1941445.hstgr.cloud', cmd]);
    let out = '', err = '';
    ssh.stdout.on('data', d => out += d.toString());
    ssh.stderr.on('data', d => {
      const str = d.toString();
      err += str;
      if (str.toLowerCase().includes('password')) {
        ssh.stdin.write('Naziha-070962\n');
      }
    });
    ssh.on('close', code => resolve({ code, out, err }));
  });
}

async function fixListenAddresses() {
  const script = `
    # Restore listening on all interfaces (both IPv4 0.0.0.0 and IPv6 ::)
    sed -i 's/^ListenAddress.*/#ListenAddress/' /etc/ssh/sshd_config
    systemctl restart ssh || systemctl restart sshd
    echo "SSH_RESET_OK"
  `;
  const res = await runSSHCommand(script);
  console.log(res.out);
}

fixListenAddresses();
