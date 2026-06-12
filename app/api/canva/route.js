import { jsonResponse } from '../../lib/validation';

export async function POST() {
  return jsonResponse({
    error: 'Direct Canva creation is disabled in this fixed build because Canva MCP cannot be reliably called from this standard server route. Use the generated slide text/images, or connect Canva using its official OAuth + Autofill API with a fillable brand template.'
  }, 501);
}
