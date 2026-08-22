import test from 'node:test';
import assert from 'node:assert/strict';
import { signWebhook, verifyWebhook } from '../src/webhook-verification.js';

const secret='test-secret';

test('accepts a correctly signed webhook',()=>{const payload={eventId:'E1',jobId:'J1',attendeeCode:'SOL-001',status:'completed'};const s=signWebhook(payload,secret);assert.equal(verifyWebhook({rawBody:s.rawBody,signature:s.signature,timestamp:s.timestamp,secret}),true)});

test('rejects a tampered payload',()=>{const payload={eventId:'E1',jobId:'J1',attendeeCode:'SOL-001',status:'completed'};const s=signWebhook(payload,secret);assert.equal(verifyWebhook({rawBody:JSON.stringify({...payload,status:'failed'}),signature:s.signature,timestamp:s.timestamp,secret}),false)});

test('rejects an expired timestamp',()=>{const payload={eventId:'E1',jobId:'J1',attendeeCode:'SOL-001',status:'completed'};const old=String(Math.floor(Date.now()/1000)-600);const s=signWebhook(payload,secret,old);assert.equal(verifyWebhook({rawBody:s.rawBody,signature:s.signature,timestamp:old,secret}),false)});
