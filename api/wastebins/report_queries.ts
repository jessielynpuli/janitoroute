// api/reports/report_queries.ts
import { supabase } from '../supabase';

export const submitWastebinReport = async (
  wastebinId: number, 
  reportedStatus: string, 
  description?: string
) => {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    return { success: false, errorMessage: "Could not identify user." };
  }

  // 1. Check if this specific user already reported this bin recently
  // (This stops one "trippy user" from spamming the button 3 times to force it full)
  const { data: existingReport } = await supabase
    .from('reports')
    .select('id')
    .eq('wastebin_id', wastebinId)
    .eq('student_id', user.id)
    .eq('reported_status', reportedStatus)
    .single();

  if (existingReport) {
    return { success: false, errorMessage: "You have already reported this bin." };
  }

  // 2. Insert the new report
  const { error: insertError } = await supabase
    .from('reports')
    .insert([{
      wastebin_id: wastebinId,
      anon_user_id: user.id,
      status: reportedStatus,
      description: description || null
    }]);

  if (insertError) return { success: false, errorMessage: insertError.message };

  // 3. Count how many "full" reports this bin has
  // { count: 'exact', head: true } tells Supabase to just return the number, not the actual rows
  const { count, error: countError } = await supabase
    .from('reports')
    .select('*', { count: 'exact', head: true })
    .eq('wastebin_id', wastebinId)
    .eq('reported_status', 'full');

  if (countError) return { success: false, errorMessage: countError.message };

  // 4. If 3 or more people say it's full, update the main wastebin!
  if (count && count >= 3) {
    await supabase
      .from('wastebins')
      .update({ status: 'full' })
      .eq('id', wastebinId);
  }

  return { success: true };
};