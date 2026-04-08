module.exports = {
  apps: [{
    name: 'sam',
    script: 'node_modules/next/dist/bin/next',
    args: 'start -p 3000',
    interpreter: 'node',
    cwd: __dirname,
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    watch: false,
    instances: 1,
    exec_mode: 'fork',
    autorestart: true,
    max_memory_restart: '1G',
    max_restarts: 5,
    restart_delay: 3000
  }]
};
