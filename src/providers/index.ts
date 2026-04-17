// Host-side provider container-config barrel.
// Providers that need host-side container setup (extra mounts, env passthrough,
// per-session directories, per-group model selection) self-register on import.
//
// Skills add a new provider by appending one import line below.

import './claude.js';
import './opencode.js';
