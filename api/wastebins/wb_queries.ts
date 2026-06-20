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
  updated_at?: string;
}

//object for input landmarks
export interface LandmarkInput {
    area_id: string;
    x_position: number;
    y_position: number;
    landmark_name: string;
    updated_at?: string;
}

//object for input areas 
export interface AreaInput {
    area_name: string;
    updated_at?: string;
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
    .select(`*, wastebins(*)`)
    .eq('area_id', areaId);

  if (error) {
    console.error("Error fetching map layout data:", error.message);
    return { success: false, error, data: [] };
  }
  return { success: true, data };
};

// 3. Create an area
export const createArea = async (areaData: AreaInput) => {
    const { data, error } = await supabase
        .from('areas')
        .insert([areaData])
        .select()
        .single();

    if (error){
        console.error("Failed to create area:", error.message);
        return{ success: false, error };
    }
    return { success: true, data: data[0] };
};

// 4. Edit an area. Name lang ba iedit? hehe

export const updateArea = async (areaId: string, updates: Partial<AreaInput>) => {
  const payloadWithTimestamp = {
        ...updates,
        updated_at: new Date().toISOString(), 
    };  
  
  const { data, error } = await supabase
        .from('areas')
        .update(payloadWithTimestamp)
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

export const createLandmark = async (landmarkData: any) => {
  try {
    const { data, error } = await supabase
      .from('landmarks')
      .insert([landmarkData])
      .select()
      .single(); // Use .single() to get the object back

    if (error) {
      console.error("Supabase Error Object:", error); // This will show you the real error!
      return { success: false, error };
    }
    return { success: true, data };
  } catch (err) {
    console.error("Caught unexpected exception:", err);
    return { success: false, error: err };
  }
};


// 2. Update/Edit a landmark

export const updateLandmark = async (landId: string, updates: Partial<LandmarkInput>) => {
  const payloadWithTimestamp = {
        ...updates,
        updated_at: new Date().toISOString(), 
    };    
  
  const { data, error } = await supabase
        .from ('landmarks')
        .update(payloadWithTimestamp)
        .eq('landmark_id', landId)
        .select();
    
    if (error) {
        console.error("Failed to update landmar:", error.message);
        return { success: false, error };
    }
    return { success: true, data: data[0] }

};

// 3. Delete a landmark

export const deleteLandmark = async (landId: string) => {
    try {
        // A. Find all wastebin IDs belonging to this landmark first so we can clear their lines too
        const { data: bins } = await supabase
            .from('wastebins')
            .select('wastebin_id')
            .eq('landmark_id', landId);

        const binIds = bins ? bins.map(b => b.wastebin_id) : [];

        // B. Clear any network edges linked to this landmark OR its child wastebins
        if (binIds.length > 0) {
            await supabase
                .from('edges')
                .delete()
                .or(`from_node_id.eq.${landId},to_node_id.eq.${landId},from_node_id.in.(${binIds.join(',')}),to_node_id.in.(${binIds.join(',')})`);
        } else {
            await supabase
                .from('edges')
                .delete()
                .or(`from_node_id.eq.${landId},to_node_id.eq.${landId}`);
        }

        // C. Finally delete the landmark. DB cascades down to clear 'wastebins' automatically!
        const { data, error } = await supabase
            .from('landmarks')
            .delete()
            .eq('landmark_id', landId)
            .select();

        console.log("Supabase Delete Landmark Response Data Raw: ", data);
        
        if (error) {
            console.error("Failed to delete landmark:", error.message);
            return { success: false, error };
        }
        
        const actuallyDeleted = data && data.length > 0;
        return { success: actuallyDeleted, error: actuallyDeleted ? null : new Error("Row not found.") };        
    } catch (err) {
        console.error("Network or API execution error during landmark delete:", err);
        return { success: false, error: err };
    }
};




// *********** WASTEBIN FUNCTIONS ******************************

/**
 * 1. CREATE (Add a new wastebin to a landmark) */
export const createWastebin = async (binData: WastebinInput) => {   //binData means WastebinInput
  const { data, error } = await supabase
    .from('wastebins') //wastebins table
    .insert([binData]) //landmark id, status, desc, photo url will be inserted
    .select()
    .single();

  if (error) {
    console.error("Failed to create wastebin:", error.message);
    return { success: false, error };
  }
  console.log("DEBUG: Insertion successful, returned data:", data);
  return { success: true, data };
  //return { success: true, data: data[0] };
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
  const payloadWithTimestamp = {
        ...updates,
        updated_at: new Date().toISOString(), 
    }; 
  
  const { data, error } = await supabase
    .from('wastebins')
    .update(payloadWithTimestamp)
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
  try {
    // A. Clear any network edges linked directly to this wastebin first
    const { error: edgeError } = await supabase
        .from('edges')
        .delete()
        .or(`from_node_id.eq.${binId},to_node_id.eq.${binId}`);

    if (edgeError) {
        console.error("Failed to clear network lines for wastebin:", edgeError.message);
    }

    // B. Now safely delete the wastebin record itself without foreign key errors
    const { data, error } = await supabase
        .from('wastebins')
        .delete()
        .eq('wastebin_id', binId)
        .select();

    if (error) {
        console.error("Failed to delete wastebin:", error.message);
        return { success: false, error };
    }

    if (!data || data.length === 0) {
        console.error(`SILENT FAILURE: Supabase could not find a wastebin with ID ${binId} to delete.`);
        return { success: false, error: new Error("Row not found or RLS blocked deletion.") }; 
    }

    console.log("Successfully deleted row from database:", data);
    return { success: true };

  } catch (err) {
    console.error("Network or API execution error during delete:", err);
    return { success: false, error: err };
  }
};

export interface AreaPriorityRow {
  area_id: string;
  area_name: string;
  total_bins: number;
  full_count: number;
  half_full_count: number;
  empty_count: number;
  priority_score: number;
}

/**
 * Fetches all areas combined with active wastebin fill-rate metrics
 * sorted descending by the amount of urgent attention required.
 */
export const fetchAreasByUrgency = async (): Promise<{ success: boolean; data: AreaPriorityRow[]; error?: any }> => {
  try {
    // 1. Fetch entire structure from areas -> landmarks -> wastebins
    const { data: areas, error } = await supabase
      .from('areas')
      .select(`
        area_id,
        area_name,
        landmarks (
          landmark_id,
          wastebins (
            wastebin_id,
            status
          )
        )
      `);

    if (error) throw error;
    if (!areas) return { success: true, data: [] };

    // 2. Map and count statuses dynamically
    const processedAreas: AreaPriorityRow[] = areas.map((area: any) => {
      let total_bins = 0;
      let full_count = 0;
      let half_full_count = 0;
      let empty_count = 0;

      area.landmarks?.forEach((landmark: any) => {
        landmark.wastebins?.forEach((bin: any) => {
          total_bins++;
          if (bin.status === 'full') {
            full_count++;
          } else if (bin.status === 'half-full') {
            half_full_count++;
          } else if (bin.status === 'empty') {
            empty_count++;
          }
        });
      });

      // Priority calculation formula: Full bins = 3 pts, Half-Full bins = 1 pt
      const priority_score = (full_count * 3) + (half_full_count * 1);

      return {
        area_id: String(area.area_id),
        area_name: area.area_name || 'Unnamed Area',
        total_bins,
        full_count,
        half_full_count,
        empty_count,
        priority_score,
      };
    });

    // 3. Sort descending (highest priority score first)
    const sortedAreas = processedAreas.sort((a, b) => b.priority_score - a.priority_score);

    return { success: true, data: sortedAreas };
  } catch (error: any) {
    console.error("Failed compiling dashboard metrics:", error);
    return { success: false, data: [], error };
  }
};

export interface RecentActivityRow {
  wastebin_id: string;
  status: 'empty' | 'half-full' | 'full';
  updated_at: string;
  area_name: string;
}

/**
 * Fetches the most recently modified wastebins across all areas
 * to act as a zero-maintenance live operations stream.
 */
export const fetchRecentActivityStream = async (limit = 15): Promise<RecentActivityRow[]> => {
  try {
    // Pull areas -> landmarks -> wastebins all at once
    const { data: areas, error } = await supabase
      .from('areas')
      .select(`
        area_name,
        landmarks (
          wastebins (
            wastebin_id,
            status,
            updated_at
          )
        )
      `);

    if (error) throw error;
    if (!areas) return [];

    const allBins: RecentActivityRow[] = [];

    // Flatten the nested structure into a single list of bins with their area name
    areas.forEach((area: any) => {
      area.landmarks?.forEach((landmark: any) => {
        landmark.wastebins?.forEach((bin: any) => {
          // Only include bins that actually have an updated_at timestamp
          if (bin.updated_at) {
            allBins.push({
              wastebin_id: bin.wastebin_id,
              status: bin.status,
              updated_at: bin.updated_at,
              area_name: area.area_name || 'Unknown Area',
            });
          }
        });
      });
    });

    // Sort by updated_at descending (most recent first) and slice to the limit
    return allBins
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, limit);

  } catch (error) {
    console.error("Error fetching activity stream:", error);
    return [];
  }
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
