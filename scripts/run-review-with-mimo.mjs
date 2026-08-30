/**
 * run-review-with-mimo.mjs — MiMo Code 逐对评审（terse 模式：仅 PDF、无截图、硬超时）。
 * MIMO_NODE=<node.exe> node scripts/run-review-with-mimo.mjs --pairs <json> --out <dir>
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawn, execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const get = (f) => { const i = args.indexOf(f); return i >= 0 && i + 1 < args.length ? args[i + 1] : undefined; };
const pairsFile = get('--pairs');
const outDir = get('--out');
if (!pairsFile || !outDir) { console.error('usage: --pairs <json> --out <dir>'); process.exit(2); }

const MIMO_BIN = process.env.MIMO_BIN || 'C:\\Users\\lev_f\\AppData\\Roaming\\npm\\node_modules\\@mimo-ai\\cli\\bin\\mimo';
const NODE = process.env.MIMO_NODE || process.execPath;
const PAIR_TIMEOUT = Number(process.env.MIMO_PAIR_TIMEOUT || 600000);
const pairs = JSON.parse(fs.readFileSync(pairsFile, 'utf-8'));
fs.mkdirSync(outDir, { recursive: true });

function runMimo(prompt, cwd) {
  return new Promise((resolve) => {
    const cmd = [MIMO_BIN, 'run', '--format', 'json', '--yolo', prompt];
    const cp = spawn(NODE, cmd, { cwd, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
    let stdout = '';
    let stderr = '';
    cp.stdout.on('data', (d) => { stdout += d; if (stdout.length > 40 * 1024 * 1024) stdout = stdout.slice(-40 * 1024 * 1024); });
    cp.stderr.on('data', (d) => { stderr += d; });
    const timer = setTimeout(() => {
      try { execFileSync('taskkill', ['/PID', String(cp.pid), '/T', '/F'], { timeout: 15000 }); } catch {}
    }, PAIR_TIMEOUT);
    cp.on('exit', (code) => {
      clearTimeout(timer);
      resolve({ code, stdout, stderr });
    });
    cp.on('error', (e) => { clearTimeout(timer); resolve({ code: -1, stdout, stderr: String(e) }); });
  });
}

for (const p of pairs) {
  const wd = path.join(outDir, p.id);
  fs.mkdirSync(wd, { recursive: true });
  const prompt = (p.prompt || '').replaceAll('{ORIGINAL}', path.resolve(p.original)).replaceAll('{EXPORT}', path.resolve(p.exported));
  fs.writeFileSync(path.join(wd, 'review-prompt.md'), prompt);
  const t0 = Date.now();
  console.log('[review] ' + p.id + ' starting ' + new Date().toISOString());
  const r = await runMimo(prompt, wd);
  const elapsed = Math.round((Date.now() - t0) / 1000);
  const stdout = r.stdout || '';
  fs.writeFileSync(path.join(wd, 'raw.jsonl'), stdout);
  // 提取 text 事件（MiMo 事件流：文本在 part.text，最终消息取最后一个 step_finish 的 messageID）
  const parts = stdout.split(/\r?\n/).filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
  const stops = parts.filter((e) => e.type === 'step_finish' && e.part?.reason === 'stop');
  const finalMsgId = stops.length ? stops[stops.length - 1].part?.messageID : null;
  const allTexts = parts.filter((e) => e.type === 'text').map((e) => e.part?.text || '').filter(Boolean);
  let final = allTexts.join('\n\n');
  if (finalMsgId) {
    const ft = parts.filter((e) => e.type === 'text' && e.part?.messageID === finalMsgId).map((e) => e.part?.text || '').filter(Boolean);
    if (ft.length) final = ft.join('\n\n');
  }
  if (final.trim()) {
    fs.writeFileSync(path.join(wd, 'review.md'), final);
    console.log('[review] ' + p.id + ' done ' + elapsed + 's (' + final.length + ' chars)');
  } else {
    const msg = (r.stderr || '').replace(/\x1b\[[0-9;]*m/g, '').slice(-1500) || 'no text output';
    fs.writeFileSync(path.join(wd, 'review.md'), '# 评审失败\n\n' + msg.slice(0, 3000));
    console.log('[review] ' + p.id + ' FAILED after ' + elapsed + 's: ' + msg.slice(0, 200));
  }
}
console.log('all reviews attempted');
