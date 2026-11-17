import test from "node:test";
import assert from "node:assert/strict";
import {recoveryTooSoon,RECOVERY_WAIT_MS} from "../lib/rolloverGuards.mjs";

test("a committed or prepared backup may be considered for recovery",()=>{
 assert.equal(recoveryTooSoon("committed",{}),false);
 assert.equal(recoveryTooSoon("prepared",{}),false);
});
test("in-progress rollover refuses recovery during the safety window",()=>{
 const now=1_800_000_000_000;
 assert.equal(recoveryTooSoon("in_progress",{startedAt:new Date(now-5000).toISOString()},now),true);
 assert.equal(recoveryTooSoon("in_progress",{startedAt:new Date(now-RECOVERY_WAIT_MS-1000).toISOString()},now),false);
});
test("a running recovery cannot be started twice immediately",()=>{
 const now=1_800_000_000_000;
 assert.equal(recoveryTooSoon("restoring",{restoringAt:new Date(now-5000).toISOString()},now),true);
});
test("missing or malformed timestamps fail closed",()=>{
 assert.equal(recoveryTooSoon("in_progress",{}),true);
 assert.equal(recoveryTooSoon("restoring",{restoringAt:"invalid"}),true);
});
