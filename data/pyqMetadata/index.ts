// ============================================================================
// PYQ Metadata Barrel & Utility Helpers
// ============================================================================

import { PYQChapterMetadata } from '../../types';
import { JEE_MAINS_PYQ_DATA } from './jeeMainsPYQ';
import { JEE_ADVANCED_PYQ_DATA } from './jeeAdvancedPYQ';

export { JEE_MAINS_PYQ_DATA, JEE_ADVANCED_PYQ_DATA };

export function getAllPYQMetadata(examType: 'JEE Mains' | 'JEE Advanced' | 'All' = 'All'): PYQChapterMetadata[] {
    if (examType === 'JEE Mains') return JEE_MAINS_PYQ_DATA;
    if (examType === 'JEE Advanced') return JEE_ADVANCED_PYQ_DATA;
    return [...JEE_MAINS_PYQ_DATA, ...JEE_ADVANCED_PYQ_DATA];
}
