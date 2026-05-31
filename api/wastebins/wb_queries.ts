// api/wastebins/queries.ts
import { supabase } from '../supabase';

/* ************** Objects ***************** */
// object for input wastebin
export interface WastebinInput {
  landmark_id: string;
  status: 'empty' | 'half-full' | 'full';
  x_position: number;
  y_position: number;
  description?: string; 
}

//object for input landmarks
export interface LandmarkInput {
    area_id: string;
    x_position: number;
    y_position: number;
    landmark_name: string;
}

//object for input areas 
export interface AreaInput {
    area_name: string;
}

// ************************** AREA FUNCTIONS **************************
/**
 * 1. FETCH ALL AREAS
 * Pulls the list of locations (e.g., "1st Floor West Wing", "2nd Floor Main Building")
 * to populate your Student/Janitor area filter dropdown selection menu.
 */
export const fetchAllAreas = async () => {
  const { data, error } = await supabase
    .from('areas')
    .select('area_id, area_name');

  if (error) throw error;
  return data || [];
};

/* 2. FETCH LANDMARKS AND BINS FILTERED BY AREA
 * When a user selects an area, this query fetches ONLY the landmarks in that area,
 * AND automatically brings along the wastebins attached to those landmarks.
 */
export const fetchMapDataByArea = async (areaId: string) => {
  const { data, error } = await supabase
    .from('landmarks')
    .select(`
      landmark_id,
      landmark_name,
      x_position,
      y_position,
      wastebins (
        wastebin_id,
        status,
        x_position,
        y_position,
        description
      )
    `)
    .eq('area_id', areaId);

  if (error) {
    console.error("Error fetching map layout data:", error.message);
    throw error;
  }
  return data || [];
};

// 3. Create an area
export const createArea = async (areaData: AreaInput) => {
    const { data, error } = await supabase
        .from('areas')
        .insert([areaData])
        .select();

    if (error){
        console.error("Failed to create area:", error.message);
        return{ success: false, error };
    }
    return { success: true, data: data[0] };
};

// 4. Edit an area. Name lang ba iedit? hehe

export const updateArea = async (areaId: string, updates: Partial<AreaInput>) => {
    const { data, error } = await supabase
        .from('areas')
        .update(updates)
        .eq('area_id', areaId)
        .select();

    if (error){
        console.error("Failed to update area:", error.message);
        return{ success: false, error };
    }
    return { success: true, data: data[0] };
};

// 5. Delete an area. Once na magdelete ba ng area, idedelete din ba nodes doon?

export const deleteArea = async (areaId: string) => {
    const { error } = await supabase
        .from('areas')
        .delete()
        .eq('area_id', areaId)

    if (error){
        console.error("Failed to delete area:", error.message);
        return{ success: false, error };
        // will add a warning. deleting an area, may delete all nodes inside it
    }
    return { success: true };
};



// ************************** LANDMARK FUNCTIONS **********************
//add photos? or icons on frontend na? depende sa name ng landmark?


// 1. Creating a landmark via admin

export const createLandmark = async (landmarkData: LandmarkInput) => {
    const { data, error } = await supabase
        .from('landmarks')
        .insert([landmarkData]) 
        .select();
    
    if (error) {
        console.error("Failed to create landmark:", error.message);
        return { success: false, error };
    }
    return { success: true, data: data[0] };
};


// 2. Update/Edit a landmark

export const updateLandmark = async (landId: string, updates: Partial<LandmarkInput>) => {
    const { data, error } = await supabase
        .from ('landmarks')
        .update(updates)
        .eq('landmark_id', landId)
        .select();
    
    if (error) {
        console.error("Failed to update landmar:", error.message);
        return { success: false, error };
    }
    return { success: true, data: data[0] }

};

// 3. Delete a landmark

export const deleteLandmark = async ( landId: string ) => {
    const { error } = await supabase
        .from('landmarks')
        .delete()
        .eq('landmark_id', landId);
    
    if (error) {
        console.error("Failed to delete landmark:", error.message);
        return{ success: false, error };
    }
    return{ success: true };
};




// *********** WASTEBIN FUNCTIONS ******************************

/**
 * 1. CREATE (Add a new wastebin to a landmark) */
export const createWastebin = async (binData: WastebinInput) => {   //binData means WastebinInput
  const { data, error } = await supabase
    .from('wastebins') //wastebins table
    .insert([binData]) //landmark id, status, desc, photo url will be inserted
    .select();

  if (error) {
    console.error("Failed to create wastebin:", error.message);
    return { success: false, error };
  }
  return { success: true, data: data[0] };
};

/**
 * 2. READ (Fetch a single wastebin's deep details)
 * Useful for opening the "Report Details" panel with descriptions and photos
 */
export const fetchWastebinDetails = async (binId: string) => {
  const { data, error } = await supabase
    .from('wastebins')
    .select('*')
    .eq('wastebin_id', binId)
    .single();

  if (error) {
    console.error("Failed to fetch bin details:", error.message);
    return null;
  }
  return data;
};

/**
 * 3. UPDATE (Modify description, photo, or status)
 * Used by admins to fix text, or students to change status flags
 */
export const updateWastebin = async (binId: string, updates: Partial<WastebinInput>) => {
  const { data, error } = await supabase
    .from('wastebins')
    .update(updates)
    .eq('wastebin_id', binId)
    .select();

  if (error) {
    console.error("Failed to update wastebin:", error.message);
    return { success: false, error };
  }
  return { success: true, data: data[0] };
};

/**
 * 4. DELETE (Remove a wastebin entirely)
 */
export const deleteWastebin = async (binId: string) => {
  const { error } = await supabase
    .from('wastebins')
    .delete()
    .eq('wastebin_id', binId);

  if (error) {
    console.error("Failed to delete wastebin:", error.message);
    return { success: false, error };
  }
  return { success: true };
};



/* Reminders:
Keep these two relational rules in mind when coding your screens:

Creation Rule: You cannot create a wastebin floating out in the void. 
When executing createWastebin, you must pass a valid landmark_id that already exists in your database, 
otherwise Supabase will reject the insertion with a foreign key violation error.

Deletion Rule: If your professor asks you to delete a Landmark, 
what happens to the wastebin? If your database foreign key constraint is set to ON DELETE CASCADE, 
wiping out a landmark will automatically destroy the wastebins attached to it. 
If it is set to RESTRICT, Supabase will block you from deleting the landmark until you manually delete its wastebins first!

*/
