
import { supabase } from "@/integrations/supabase/client";

export async function setupEmergencyTenders() {
  const emergencyTenders = [
    {
      title: "Emergency Medical Supplies Procurement",
      description: "Urgent procurement of medical supplies including PPE, medications, and medical equipment for public hospitals.",
      deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      category: "Healthcare",
      location: "Nairobi",
      procuring_entity: "Ministry of Health",
      tender_no: "MOH-EMRG-001-2025",
      source: "emergency-setup",
      contact_info: "procurement@health.go.ke",
      requirements: "Valid pharmacy license, WHO-GMP certification",
      points_required: 0,
      tender_url: "https://health.go.ke/tenders"
    },
    {
      title: "School Infrastructure Repair Services",
      description: "Repair and maintenance of school infrastructure including classrooms, laboratories, and sanitation facilities.",
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      category: "Construction",
      location: "Central Kenya",
      procuring_entity: "Ministry of Education",
      tender_no: "MOE-INFR-002-2025",
      source: "emergency-setup",
      contact_info: "tenders@education.go.ke",
      requirements: "Valid construction license, experience in school projects",
      points_required: 0,
      tender_url: "https://education.go.ke/tenders"
    },
    {
      title: "Water Borehole Drilling Project",
      description: "Drilling and installation of water boreholes in rural communities to improve access to clean water.",
      deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
      category: "Water & Sanitation",
      location: "Turkana County",
      procuring_entity: "Ministry of Water",
      tender_no: "MOW-BORE-003-2025",
      source: "emergency-setup",
      contact_info: "water.projects@water.go.ke",
      requirements: "Water drilling license, geological survey capability",
      points_required: 0,
      tender_url: "https://water.go.ke/tenders"
    },
    {
      title: "Digital Learning Platform Development",
      description: "Development of a comprehensive digital learning platform for primary and secondary schools.",
      deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
      category: "IT",
      location: "Remote/Online",
      procuring_entity: "Kenya Institute of Curriculum Development",
      tender_no: "KICD-DIG-004-2025",
      source: "emergency-setup",
      contact_info: "ict@kicd.ac.ke",
      requirements: "Software development certification, education sector experience",
      points_required: 0,
      tender_url: "https://kicd.ac.ke/tenders"
    },
    {
      title: "Agricultural Equipment Supply",
      description: "Supply of modern agricultural equipment including tractors, ploughs, and harvesting machines for farmer cooperatives.",
      deadline: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000).toISOString(),
      category: "Agriculture",
      location: "Rift Valley",
      procuring_entity: "Agricultural Development Corporation",
      tender_no: "ADC-EQUIP-005-2025",
      source: "emergency-setup",
      contact_info: "procurement@adc.co.ke",
      requirements: "Agricultural equipment dealer license, after-sales service capability",
      points_required: 0,
      tender_url: "https://adc.co.ke/tenders"
    }
  ];

  try {
    const { data, error } = await supabase
      .from('tenders')
      .insert(emergencyTenders)
      .select();

    if (error) {
      console.error("Error setting up emergency tenders:", error);
      return { success: false, error: error.message };
    }

    console.log(`Successfully set up ${data.length} emergency tenders`);
    return { success: true, count: data.length };
  } catch (error) {
    console.error("Failed to setup emergency tenders:", error);
    return { success: false, error: error.message };
  }
}
