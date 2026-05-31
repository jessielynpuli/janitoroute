// api/reports/report_queries.ts
import { supabase } from '../supabase';

export const submitWastebinReport = async (
  wastebinId: string, 
  reportedStatus: string, 
  description?: string,
  photo_url?: string,
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
    .eq('anon_user_id', user.id)
    .eq('status', reportedStatus)
    .single();

  if (existingReport) {
    return { success: false, errorMessage: "You have already reported this bin." };
  }
  
// 1. Handle the photo upload if a photo exists
  let uploadedPhotoUrl = null;
  if (photo_url) {
    uploadedPhotoUrl = await uploadReportPhoto(photo_url, user.id);
  }


  // 2. Insert the new report
  const { error: insertError } = await supabase
    .from('reports')
    .insert([{
      wastebin_id: wastebinId,
      anon_user_id: user.id,
      status: reportedStatus,
      description: description || null,
      photo_url: uploadedPhotoUrl
    }]);

  if (insertError) return { success: false, errorMessage: insertError.message };

  // 3. Count how many "full" reports this bin has
  // { count: 'exact', head: true } tells Supabase to just return the number, not the actual rows
  const { count, error: countError } = await supabase
    .from('reports')
    .select('*', { count: 'exact', head: true })
    .eq('wastebin_id', wastebinId)
    .eq('status', 'full');

  if (countError) return { success: false, errorMessage: countError.message };

  // 4. If 3 or more people say it's full, update the main wastebin!
  if (count && count >= 3) {
    await supabase
      .from('wastebins')
      .update({ status: 'full' })
      .eq('wastebin_id', wastebinId);
  }

  return { success: true };
};

// Helper function to upload the image to Supabase Storage
const uploadReportPhoto = async (photo_url: string, anonUserId: string) => {
  try {
    // 1. Convert the local React Native URI to a Blob
    const response = await fetch(photo_url);
    const blob = await response.blob();

    // 2. Generate a unique filename (e.g., "12345/1678901234.jpg")
    // Grouping them in folders by user ID keeps your bucket organized
    const fileExt = photo_url.split('.').pop() || 'jpg';
    const fileName = `${anonUserId}/${Date.now()}.${fileExt}`;

    // 3. Upload to your bucket (replace 'photo_reports' with your actual bucket name)
    const { data, error } = await supabase.storage
      .from('photo_reports')
      .upload(fileName, blob, {
        contentType: `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`,
      });

    if (error) throw error;

    // 4. Get the public URL so we can save it in the database
    const { data: publicUrlData } = supabase.storage
      .from('photo_reports')
      .getPublicUrl(fileName);

    return publicUrlData.publicUrl;

  } catch (error: any) {
    console.error("Photo upload failed:", error.message);
    return null; // If upload fails, we return null but still allow the text report
  }
};