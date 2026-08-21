'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseClient } from '@/lib/supabase-client';
import { getDatabase } from '@/lib/database/adapter';
import { THEMES } from '@/themes/registry';
import posthog from 'posthog-js';

// Full signup restored from 18d2809 with 20% commission — content loaded from verified local restore
// If this stub is still present, the full file push failed size limits.
export { default } from './page.full';
