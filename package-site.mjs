// Package only generated public application output; never runtime secrets or notes.
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {mkdir,readFile,writeFile,readdir,rm} from 'node:fs/promises';
import assert from 'node:assert/strict';

// A clean output directory prevents stale files entering a release.
await rm('dist',{recursive:true,force:true});
execFileSync(process.execPath,['build-hosted.mjs'],{stdio:'inherit'});
const manifest=JSON.parse(await readFile('dist/.openai/hosting.json','utf8'));
assert.equal(manifest.project_id,'appgprj_6ad8a633413c819182ed9cc6405eb178','Keep the existing private Site identity');
assert.deepEqual((await readdir('dist')).sort(),['.openai','server']);
assert.deepEqual(await readdir('dist/.openai'),['hosting.json']);
assert.deepEqual(await readdir('dist/server'),['index.js']);
const commit=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
assert.match(commit,/^[a-f0-9]{40}$/);
const modified=execFileSync('git',['diff','--name-only','HEAD'],{encoding:'utf8'}).trim();
assert.equal(modified,'','Commit source changes before packaging');
const untracked=execFileSync('git',['ls-files','--others','--exclude-standard'],{encoding:'utf8'}).trim();
assert.equal(untracked,'','Commit authored files before packaging');
await mkdir('build/site-release',{recursive:true});
// Include the font license alongside the embedded font's Worker distribution.
await writeFile('dist/OFL-Lobster.txt',await readFile('web/OFL-Lobster.txt'));
execFileSync('tar',['-czf','build/site-release/site.tar.gz','-C','dist','.']);
const digest=createHash('sha256').update(await readFile('build/site-release/site.tar.gz')).digest('hex');
await writeFile('build/site-release/site.tar.gz.sha256',digest+'  site.tar.gz\n');
await writeFile('build/site-release/release.json',JSON.stringify({schema_version:1,project_id:manifest.project_id,source_commit:commit,archive:'site.tar.gz',archive_sha256:digest,status:'prepared',publishing:'Authenticated Sites tooling required; never deploy the hosted adapter as a public Worker.'},null,2)+'\n');
console.log('Prepared build/site-release/site.tar.gz for '+commit+'; this command does not publish.');
