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

async function fixSSH() {
  console.log("=== CHECKING SSH CONF & FIREWALL ON VPS ===");
  // Ensure sshd listens on 0.0.0.0 (all IPv4 interfaces) and root login / password auth is allowed
  const script = `
    sed -i 's/#ListenAddress 0.0.0.0/ListenAddress 0.0.0.0/' /etc/ssh/sshd_config
    sed -i 's/ListenAddress ::/#ListenAddress ::/' /etc/ssh/sshd_config
    grep -q "^ListenAddress 0.0.0.0" /etc/ssh/sshd_config || echo "ListenAddress 0.0.0.0" >> /etc/ssh/sshd_config
    sed -i 's/^#PermitRootLogin.*/PermitRootLogin yes/' /etc/ssh/sshd_config
    sed -i 's/^PermitRootLogin.*/PermitRootLogin yes/' /etc/ssh/sshd_config
    sed -i 's/^#PasswordAuthentication.*/PasswordAuthentication yes/' /etc/ssh/sshd_config
    sed -i 's/^PasswordAuthentication.*/PasswordAuthentication yes/' /etc/ssh/sshd_config
    
    # Check UFW status and allow port 22
    if command -v ufw > /dev/null; then
      ufw allow 22/tcp || true
      ufw allow ssh || true
    fi

    # Restart SSH service
    systemctl restart ssh || systemctl restart sshd
    echo "SSH_SERVICE_RESTARTED"
  `;

  const res = await runSSHCommand(script);
  console.log("Result Code:", res.code);
  console.log("Stdout:", res.out);
  console.log("Stderr:", res.err);
}

fixSSH();
