import { mkdirSync, writeFileSync } from 'node:fs';
mkdirSync('backend-public',{recursive:true});
writeFileSync('backend-public/index.html','<!doctype html><html lang="ja"><meta charset="utf-8"><title>Hikone API</title><p>彦根の徒歩経路APIです。</p></html>');
