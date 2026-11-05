import os
import shutil
import pymongo
from dotenv import load_dotenv
from datetime import datetime, timedelta

# Load environment variables
load_dotenv()

# Source images from brain folder (fallback check)
images_source = {
    "chassis": r"C:\Users\Lenovo\.gemini\antigravity\brain\ff3cc410-70b9-46f8-b44a-8003ebc57841\auto_rickshaw_chassis_frame_1793853201228.jpg",
    "engine": r"C:\Users\Lenovo\.gemini\antigravity\brain\ff3cc410-70b9-46f8-b44a-8003ebc57841\auto_rickshaw_engine_assembly_1793853219202.jpg",
    "differential": r"C:\Users\Lenovo\.gemini\antigravity\brain\ff3cc410-70b9-46f8-b44a-8003ebc57841\auto_rickshaw_rear_axle_differential_1793853237265.jpg",
    "suspension": r"C:\Users\Lenovo\.gemini\antigravity\brain\ff3cc410-70b9-46f8-b44a-8003ebc57841\auto_rickshaw_front_suspension_fork_1793853256229.jpg",
    "cabin": r"C:\Users\Lenovo\.gemini\antigravity\brain\ff3cc410-70b9-46f8-b44a-8003ebc57841\auto_rickshaw_cabin_body_frame_1793853275667.jpg"
}

dest_dir_backend = os.path.abspath(os.path.join(os.path.dirname(__file__), "uploads"))
dest_dir_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "uploads"))
os.makedirs(dest_dir_backend, exist_ok=True)
os.makedirs(dest_dir_root, exist_ok=True)

copied_urls = {}
for key, src_path in images_source.items():
    filename = f"auto_rickshaw_{key}.jpg"
    dest_path_backend = os.path.join(dest_dir_backend, filename)
    dest_path_root = os.path.join(dest_dir_root, filename)
    if os.path.exists(src_path):
        shutil.copyfile(src_path, dest_path_backend)
        shutil.copyfile(src_path, dest_path_root)
    copied_urls[key] = f"http://localhost:8000/uploads/{filename}"

# Connect to MongoDB Atlas
mongodb_url = os.getenv("MONGODB_URI") or os.getenv("MONGODB_URL", "mongodb://localhost:27017")
db_name = os.getenv("MONGODB_DB_NAME", "bill_generator_db")
print(f"Connecting to MongoDB: {mongodb_url[:40]}... (DB: {db_name})")
client = pymongo.MongoClient(mongodb_url)
db = client[db_name]

# ==============================================================================
# 1. PRODUCTS (Auto Rickshaw Manufacturing & Spares)
# ==============================================================================
db.products.delete_many({})
products_data = [
    {
        "name": "Auto Rickshaw Heavy-Duty Tubular Chassis Frame",
        "description": "High-tensile mild steel tubular chassis engineered for 3-wheeler auto rickshaw manufacturing. Anti-corrosive electrophoretic primer coated, precision MIG welded with reinforced engine cradle.",
        "image": copied_urls["chassis"],
        "price": 18500.0,
        "stock": 42
    },
    {
        "name": "200cc 4-Stroke CNG/Petrol Engine & Gearbox Assembly",
        "description": "Single-cylinder 4-stroke forced-air-cooled 198.6cc engine unit with integrated 4-speed manual constant mesh transmission gearbox, reverse gear mechanism, and CDI ignition.",
        "image": copied_urls["engine"],
        "price": 34500.0,
        "stock": 24
    },
    {
        "name": "Heavy-Duty Rear Differential Axle Assembly",
        "description": "Precision-machined rear differential axle with hypoid crown wheel & pinion gear set, hardened axle shafts, and integrated hydraulic drum brake hub assemblies.",
        "image": copied_urls["differential"],
        "price": 14800.0,
        "stock": 38
    },
    {
        "name": "Front Telescopic Fork & Hydraulic Dual Spring Suspension",
        "description": "Heavy-duty front suspension fork assembly equipped with dual helical coil springs, chrome hydraulic shock absorber dampers, reinforced steering stem.",
        "image": copied_urls["suspension"],
        "price": 6800.0,
        "stock": 55
    },
    {
        "name": "Auto Rickshaw Sheet Metal Cabin Body & Canopy Hood",
        "description": "High-grade pressed CRCA steel driver cowl and passenger seating frame featuring signature automotive gloss yellow finish with heavy-duty waterproof UV-resistant Rexine canvas canopy roof.",
        "image": copied_urls["cabin"],
        "price": 23500.0,
        "stock": 7  # Low stock (< 10) trigger for dashboard
    },
    {
        "name": "Complete Automotive Wiring Harness & CDI Ignition Kit",
        "description": "Flame-retardant copper automotive wire harness loom with waterproof multi-pin couplers, 12V 35W headlight relay, flasher unit, fuse box, and ignition coil.",
        "image": copied_urls["engine"],
        "price": 2850.0,
        "stock": 65
    },
    {
        "name": "Sequential CNG Gas Conversion Kit & Venturi Regulator",
        "description": "Government approved retro-fit CNG fuel induction kit with high pressure regulator (200 bar), low-pressure gas solenoid valve, fuel selector switch, and emulator unit.",
        "image": copied_urls["engine"],
        "price": 16200.0,
        "stock": 18
    },
    {
        "name": "Front & Rear Hydraulic Drum Brake Assembly Set",
        "description": "Cast iron heavy-duty brake drums with high-friction asbestos-free bonded brake shoe linings, wheel cylinders, and stainless steel return springs for 3-wheel commercial vehicles.",
        "image": copied_urls["differential"],
        "price": 4200.0,
        "stock": 48
    },
    {
        "name": "Heavy-Duty 4.00-8 Commercial Rim & Tubeless Tyre Set (Set of 3)",
        "description": "Pressed steel 8-inch rims with 6-ply rated heavy-duty all-weather rib tread pattern tubeless tyres engineered for commercial passenger & cargo 3-wheelers.",
        "image": copied_urls["chassis"],
        "price": 6900.0,
        "stock": 30
    },
    {
        "name": "Digital Speedometer & Meter Console Dashboard Cluster",
        "description": "Waterproof illuminated dashboard instrument cluster with analog speedometer, digital odometer, fuel/CNG gauge, gear indicator, and turn signal telltale lamps.",
        "image": copied_urls["cabin"],
        "price": 2400.0,
        "stock": 5  # Low stock trigger
    }
]
res_p = db.products.insert_many(products_data)
print(f"Products: inserted {len(res_p.inserted_ids)} real-world products.")

# ==============================================================================
# 2. CUSTOMERS (Auto Dealerships, Garages & Fleet Operators across India)
# ==============================================================================
db.customers.delete_many({})
customers_data = [
    {
        "name": "Gujarat Auto Spares & Body Works",
        "mobile_number": "+91 98250 14829",
        "email": "gujarat.autospares@gmail.com",
        "gst_number": "24AABCG1234F1ZX",
        "billing_address": "Plot 42, GIDC Industrial Estate, Odhav, Ahmedabad, Gujarat 382415",
        "delivery_address": "Plot 42, GIDC Industrial Estate, Odhav, Ahmedabad, Gujarat 382415",
        "bank_name": "State Bank of India",
        "account_holder_name": "Gujarat Auto Spares & Body Works",
        "account_number": "31049281726",
        "ifsc_code": "SBIN0001042",
        "branch_name": "Odhav Industrial Branch",
        "account_type": "Current"
    },
    {
        "name": "Jai Hind Three-Wheeler Motors",
        "mobile_number": "+91 98765 43210",
        "email": "jaihind.motors.pune@rediffmail.com",
        "gst_number": "27AAACJ8765E1Z9",
        "billing_address": "Shop 14-16, Auto Market, Near Swargate Bus Station, Pune, Maharashtra 411002",
        "delivery_address": "Warehouse 3, Hadapsar Industrial Estate, Pune, Maharashtra 411013",
        "bank_name": "HDFC Bank",
        "account_holder_name": "Jai Hind Three-Wheeler Motors",
        "account_number": "50200049281726",
        "ifsc_code": "HDFC0000103",
        "branch_name": "Swargate Branch",
        "account_type": "Current"
    },
    {
        "name": "Royal Auto Engineering Works",
        "mobile_number": "+91 91234 56789",
        "email": "royal.auto.blr@outlook.com",
        "gst_number": "29AAACR4321K1ZW",
        "billing_address": "Plot 18/B, Peenya Industrial Area Phase-2, Bengaluru, Karnataka 560058",
        "delivery_address": "Plot 18/B, Peenya Industrial Area Phase-2, Bengaluru, Karnataka 560058",
        "bank_name": "Canara Bank",
        "account_holder_name": "Royal Auto Engineering Works",
        "account_number": "0421201004829",
        "ifsc_code": "CNRB0000421",
        "branch_name": "Peenya Branch",
        "account_type": "Current"
    },
    {
        "name": "Bajrang Auto Fleet & Body Builders",
        "mobile_number": "+91 99887 76655",
        "email": "bajrangfleet.jaipur@gmail.com",
        "gst_number": "08AAACB9876D1ZU",
        "billing_address": "Ring Road No. 2, Transport Nagar, Jaipur, Rajasthan 302013",
        "delivery_address": "Plot 89, VKI Area, Road No. 6, Jaipur, Rajasthan 302013",
        "bank_name": "Bank of Baroda",
        "account_holder_name": "Bajrang Auto Fleet",
        "account_number": "14280200004928",
        "ifsc_code": "BARB0TRANSP",
        "branch_name": "Transport Nagar Jaipur",
        "account_type": "Current"
    },
    {
        "name": "Green City E-Auto & Rickshaw Agency",
        "mobile_number": "+91 94150 78923",
        "email": "greencityeauto@yahoo.com",
        "gst_number": "09AAACG5432B1Z8",
        "billing_address": "Block C-5, Transport Nagar, Kanpur, Uttar Pradesh 208023",
        "delivery_address": "Block C-5, Transport Nagar, Kanpur, Uttar Pradesh 208023",
        "bank_name": "Punjab National Bank",
        "account_holder_name": "Green City E-Auto Agency",
        "account_number": "1042002100039281",
        "ifsc_code": "PUNB0104200",
        "branch_name": "Transport Nagar Kanpur",
        "account_type": "Current"
    },
    {
        "name": "Surat Auto Syndicate & Spare Dealers",
        "mobile_number": "+91 98251 98452",
        "email": "surat.autosyndicate@gmail.com",
        "gst_number": "24AACCS5842N1ZG",
        "billing_address": "Shop 21, Ring Road Auto Market, Surat, Gujarat 395002",
        "delivery_address": "Godown 4, Udhna GIDC, Surat, Gujarat 394210",
        "bank_name": "ICICI Bank",
        "account_holder_name": "Surat Auto Syndicate",
        "account_number": "002805018274",
        "ifsc_code": "ICIC0000028",
        "branch_name": "Ring Road Surat",
        "account_type": "Current"
    },
    {
        "name": "Malwa Three-Wheeler Logistics & Spares",
        "mobile_number": "+91 97520 48291",
        "email": "malwa.transport.spares@gmail.com",
        "gst_number": "23AAACM7412P1ZL",
        "billing_address": "12/A Sanwer Road Industrial Area, Sector C, Indore, Madhya Pradesh 452015",
        "delivery_address": "12/A Sanwer Road Industrial Area, Sector C, Indore, Madhya Pradesh 452015",
        "bank_name": "Axis Bank",
        "account_holder_name": "Malwa Three-Wheeler Logistics",
        "account_number": "918020048291823",
        "ifsc_code": "UTIB0000184",
        "branch_name": "Sanwer Road Indore",
        "account_type": "Current"
    }
]
res_c = db.customers.insert_many(customers_data)
print(f"Customers: inserted {len(res_c.inserted_ids)} enterprise customers.")

# ==============================================================================
# 3. LABOURS (Skilled Technicians, Machinists, Welders, QC Inspectors)
# ==============================================================================
db.labours.delete_many({})
labours_data = [
    {
        "name": "Rameshwar Patel",
        "mobile_number": "+91 98241 12345",
        "address": "Bapunagar, Ahmedabad, Gujarat",
        "salary": 24000.0,
        "image": "",
        "aadhar_image": ""
    },
    {
        "name": "Sunil Kumar Vishwakarma",
        "mobile_number": "+91 97234 56789",
        "address": "Vatva GIDC, Ahmedabad, Gujarat",
        "salary": 26500.0,
        "image": "",
        "aadhar_image": ""
    },
    {
        "name": "Manojbhai Parmar",
        "mobile_number": "+91 96385 27410",
        "address": "Odhav Industrial Area, Ahmedabad, Gujarat",
        "salary": 21000.0,
        "image": "",
        "aadhar_image": ""
    },
    {
        "name": "Deepak Yadav",
        "mobile_number": "+91 95123 48765",
        "address": "Changodar, Ahmedabad, Gujarat",
        "salary": 22500.0,
        "image": "",
        "aadhar_image": ""
    },
    {
        "name": "Mohammad Rizwan Ansari",
        "mobile_number": "+91 98980 41238",
        "address": "Naroda GIDC, Ahmedabad, Gujarat",
        "salary": 28000.0,
        "image": "",
        "aadhar_image": ""
    },
    {
        "name": "Kailash Chand Sharma",
        "mobile_number": "+91 94265 89123",
        "address": "Amraiwadi, Ahmedabad, Gujarat",
        "salary": 23000.0,
        "image": "",
        "aadhar_image": ""
    }
]
res_l = db.labours.insert_many(labours_data)
print(f"Labours: inserted {len(res_l.inserted_ids)} factory personnel.")

# ==============================================================================
# 4. PURCHASES (Raw Materials, Steel, Gas, Machined Components)
# ==============================================================================
db.purchases.delete_many({})
purchases_data = [
    {
        "purchase_name": "Seamless Mild Steel ERW Pipes Batch (Tata Structura)",
        "supplier_name": "Tata Steel Tubes Division / Shanti Steels Ltd",
        "purchase_date": (datetime.now() - timedelta(days=28)).strftime("%Y-%m-%d"),
        "amount": 285000.0,
        "status": "Paid",
        "category": "Raw Materials",
        "bill_number": "PUR-TS-2026-089",
        "notes": "12 Tonnes of 32mm OD high-yield hollow steel tubes for auto rickshaw main chassis manufacturing."
    },
    {
        "purchase_name": "MIG Welding Pure Argon Gas Cylinders & ER70S-6 Wire",
        "supplier_name": "Gujarat Industrial Gases & Welding Corp",
        "purchase_date": (datetime.now() - timedelta(days=22)).strftime("%Y-%m-%d"),
        "amount": 48500.0,
        "status": "Paid",
        "category": "Consumables",
        "bill_number": "PUR-GIG-2026-114",
        "notes": "20 high-pressure argon cylinders + 150 kg copper coated solid MIG welding wire spools."
    },
    {
        "purchase_name": "Aluminium Die Cast Engine Crankcase Billets",
        "supplier_name": "Hindalco Industries / Precision Castings Hub",
        "purchase_date": (datetime.now() - timedelta(days=16)).strftime("%Y-%m-%d"),
        "amount": 195000.0,
        "status": "Paid",
        "category": "Raw Materials",
        "bill_number": "PUR-HIN-2026-302",
        "notes": "50 sets of heat-treated gravity die-cast aluminium crankcase halves."
    },
    {
        "purchase_name": "SKF Tapered Roller Bearings & Differential Gear Pinions",
        "supplier_name": "SKF India Industrial Bearings Distributor",
        "purchase_date": (datetime.now() - timedelta(days=11)).strftime("%Y-%m-%d"),
        "amount": 76000.0,
        "status": "Paid",
        "category": "Machine Tools",
        "bill_number": "PUR-SKF-2026-442",
        "notes": "High load dynamic tapered roller bearings for 3-wheeler rear differential shafts."
    },
    {
        "purchase_name": "CRCA Automotive Sheet Metal Coils (Grade D)",
        "supplier_name": "JSW Steel Ltd / Royal Metal Traders",
        "purchase_date": (datetime.now() - timedelta(days=6)).strftime("%Y-%m-%d"),
        "amount": 165000.0,
        "status": "Pending",
        "category": "Raw Materials",
        "bill_number": "PUR-JSW-2026-512",
        "notes": "6.5 Tonnes cold-rolled close annealed sheet coils for driver cowl & mudguard stamping."
    },
    {
        "purchase_name": "Automotive Powder Coating Powder & Anti-Rust Primer",
        "supplier_name": "Asian Paints Industrial Coatings Division",
        "purchase_date": (datetime.now() - timedelta(days=3)).strftime("%Y-%m-%d"),
        "amount": 34000.0,
        "status": "Pending",
        "category": "Consumables",
        "bill_number": "PUR-AP-2026-621",
        "notes": "Gloss yellow automotive polyester powder coating batch and zinc chromate primer."
    }
]
res_pur = db.purchases.insert_many(purchases_data)
print(f"Purchases: inserted {len(res_pur.inserted_ids)} supplier purchases.")

# ==============================================================================
# 5. EXPENSES (Factory Operational, Utilities, Tooling)
# ==============================================================================
db.expenses.delete_many({})
expenses_data = [
    {
        "description": "Torrent Power Industrial High-Tension (HT) Electricity Bill",
        "amount": 62500.0,
        "date": (datetime.now() - timedelta(days=26)).strftime("%Y-%m-%d")
    },
    {
        "description": "GIDC Factory Shed Monthly Lease Rent (Odhav Unit 1 & 2)",
        "amount": 55000.0,
        "date": (datetime.now() - timedelta(days=20)).strftime("%Y-%m-%d")
    },
    {
        "description": "CNC Pipe Bender & Hydraulic Press 200T Preventative Maintenance",
        "amount": 18500.0,
        "date": (datetime.now() - timedelta(days=14)).strftime("%Y-%m-%d")
    },
    {
        "description": "Finished Frame Logistics & Transport Freight (Ahmedabad to Pune)",
        "amount": 24000.0,
        "date": (datetime.now() - timedelta(days=8)).strftime("%Y-%m-%d")
    },
    {
        "description": "Factory Health, Safety & Fire Extinguisher Refilling Compliance",
        "amount": 8500.0,
        "date": (datetime.now() - timedelta(days=4)).strftime("%Y-%m-%d")
    },
    {
        "description": "Staff Canteen & Drinking Water RO Plant Monthly AMC",
        "amount": 6200.0,
        "date": (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")
    }
]
res_exp = db.expenses.insert_many(expenses_data)
print(f"Expenses: inserted {len(res_exp.inserted_ids)} operational expenses.")

# ==============================================================================
# 6. INVOICES (Realistic Multi-Line GST Invoices with accurate tax & balances)
# ==============================================================================
db.invoices.delete_many({})

base_bank = {
    "bank_name": "State Bank of India",
    "account_holder_name": "SiddhiVinayak Enterprise",
    "account_number": "39482019482",
    "ifsc_code": "SBIN0001042",
    "branch_name": "Odhav Industrial Branch, Ahmedabad",
    "account_type": "Current Account"
}

invoices_data = [
    {
        "invoice_number": "INV-2026-0001",
        "client": "Gujarat Auto Spares & Body Works",
        "customer_phone": "+91 98250 14829",
        "customer_gst": "24AABCG1234F1ZX",
        "customer_email": "gujarat.autospares@gmail.com",
        "customer_address": "Plot 42, GIDC Industrial Estate, Odhav, Ahmedabad, Gujarat 382415",
        "date": (datetime.now() - timedelta(days=32)).strftime("%Y-%m-%d"),
        "payment_terms": "15 Days",
        "payment_terms_days": 15,
        "due_date": (datetime.now() - timedelta(days=17)).strftime("%Y-%m-%d"),
        "payment_method": "NEFT/RTGS",
        "place_of_supply": "Intra-State (Within Gujarat - CGST+SGST)",
        "items": [
            {
                "description": "Auto Rickshaw Heavy-Duty Tubular Chassis Frame",
                "quantity": 10.0,
                "unit_price": 18500.0,
                "total": 185000.0
            },
            {
                "description": "Front Telescopic Fork & Hydraulic Dual Spring Suspension",
                "quantity": 10.0,
                "unit_price": 6800.0,
                "total": 68000.0
            }
        ],
        "subtotal": 253000.0,
        "discount_amount": 5000.0,
        "tax_percent": 18.0,
        "taxable_amount": 248000.0,
        "cgst_amount": 22320.0,
        "sgst_amount": 22320.0,
        "igst_amount": 0.0,
        "amount": 292640.0,
        "amount_paid": 292640.0,
        "balance_due": 0.0,
        "status": "Paid",
        **base_bank,
        "notes": "Dispatch through Mahavir Roadlines (GR #84920). All items quality inspected."
    },
    {
        "invoice_number": "INV-2026-0002",
        "client": "Jai Hind Three-Wheeler Motors",
        "customer_phone": "+91 98765 43210",
        "customer_gst": "27AAACJ8765E1Z9",
        "customer_email": "jaihind.motors.pune@rediffmail.com",
        "customer_address": "Shop 14-16, Auto Market, Near Swargate Bus Station, Pune, Maharashtra 411002",
        "date": (datetime.now() - timedelta(days=24)).strftime("%Y-%m-%d"),
        "payment_terms": "30 Days",
        "payment_terms_days": 30,
        "due_date": (datetime.now() + timedelta(days=6)).strftime("%Y-%m-%d"),
        "payment_method": "Bank Transfer",
        "place_of_supply": "Inter-State (Outside Gujarat - IGST)",
        "items": [
            {
                "description": "200cc 4-Stroke CNG/Petrol Engine & Gearbox Assembly",
                "quantity": 6.0,
                "unit_price": 34500.0,
                "total": 207000.0
            },
            {
                "description": "Heavy-Duty Rear Differential Axle Assembly",
                "quantity": 6.0,
                "unit_price": 14800.0,
                "total": 88800.0
            }
        ],
        "subtotal": 295800.0,
        "discount_amount": 7800.0,
        "tax_percent": 18.0,
        "taxable_amount": 288000.0,
        "cgst_amount": 0.0,
        "sgst_amount": 0.0,
        "igst_amount": 51840.0,
        "amount": 339840.0,
        "amount_paid": 339840.0,
        "balance_due": 0.0,
        "status": "Paid",
        **base_bank,
        "notes": "Payment received in full via HDFC RTGS Ref: HDFCR5202610190038."
    },
    {
        "invoice_number": "INV-2026-0003",
        "client": "Surat Auto Syndicate & Spare Dealers",
        "customer_phone": "+91 98251 98452",
        "customer_gst": "24AACCS5842N1ZG",
        "customer_email": "surat.autosyndicate@gmail.com",
        "customer_address": "Shop 21, Ring Road Auto Market, Surat, Gujarat 395002",
        "date": (datetime.now() - timedelta(days=18)).strftime("%Y-%m-%d"),
        "payment_terms": "15 Days",
        "payment_terms_days": 15,
        "due_date": (datetime.now() - timedelta(days=3)).strftime("%Y-%m-%d"),
        "payment_method": "UPI",
        "place_of_supply": "Intra-State (Within Gujarat - CGST+SGST)",
        "items": [
            {
                "description": "Complete Automotive Wiring Harness & CDI Ignition Kit",
                "quantity": 25.0,
                "unit_price": 2850.0,
                "total": 71250.0
            },
            {
                "description": "Front & Rear Hydraulic Drum Brake Assembly Set",
                "quantity": 15.0,
                "unit_price": 4200.0,
                "total": 63000.0
            }
        ],
        "subtotal": 134250.0,
        "discount_amount": 2250.0,
        "tax_percent": 18.0,
        "taxable_amount": 132000.0,
        "cgst_amount": 11880.0,
        "sgst_amount": 11880.0,
        "igst_amount": 0.0,
        "amount": 155760.0,
        "amount_paid": 100000.0,
        "balance_due": 55760.0,
        "status": "Pending",
        **base_bank,
        "notes": "Advance Rs. 1,00,000 received via UPI. Balance Rs. 55,760 promised on 10th Nov."
    },
    {
        "invoice_number": "INV-2026-0004",
        "client": "Royal Auto Engineering Works",
        "customer_phone": "+91 91234 56789",
        "customer_gst": "29AAACR4321K1ZW",
        "customer_email": "royal.auto.blr@outlook.com",
        "customer_address": "Plot 18/B, Peenya Industrial Area Phase-2, Bengaluru, Karnataka 560058",
        "date": (datetime.now() - timedelta(days=12)).strftime("%Y-%m-%d"),
        "payment_terms": "15 Days",
        "payment_terms_days": 15,
        "due_date": (datetime.now() + timedelta(days=3)).strftime("%Y-%m-%d"),
        "payment_method": "Bank Transfer",
        "place_of_supply": "Inter-State (Outside Gujarat - IGST)",
        "items": [
            {
                "description": "Auto Rickshaw Sheet Metal Cabin Body & Canopy Hood",
                "quantity": 5.0,
                "unit_price": 23500.0,
                "total": 117500.0
            },
            {
                "description": "Heavy-Duty 4.00-8 Commercial Rim & Tubeless Tyre Set (Set of 3)",
                "quantity": 10.0,
                "unit_price": 6900.0,
                "total": 69000.0
            }
        ],
        "subtotal": 186500.0,
        "discount_amount": 4500.0,
        "tax_percent": 18.0,
        "taxable_amount": 182000.0,
        "cgst_amount": 0.0,
        "sgst_amount": 0.0,
        "igst_amount": 32760.0,
        "amount": 214760.0,
        "amount_paid": 214760.0,
        "balance_due": 0.0,
        "status": "Paid",
        **base_bank,
        "notes": "Full settlement done via Canara Bank NEFT."
    },
    {
        "invoice_number": "INV-2026-0005",
        "client": "Bajrang Auto Fleet & Body Builders",
        "customer_phone": "+91 99887 76655",
        "customer_gst": "08AAACB9876D1ZU",
        "customer_email": "bajrangfleet.jaipur@gmail.com",
        "customer_address": "Ring Road No. 2, Transport Nagar, Jaipur, Rajasthan 302013",
        "date": (datetime.now() - timedelta(days=7)).strftime("%Y-%m-%d"),
        "payment_terms": "15 Days",
        "payment_terms_days": 15,
        "due_date": (datetime.now() + timedelta(days=8)).strftime("%Y-%m-%d"),
        "payment_method": "Bank Transfer",
        "place_of_supply": "Inter-State (Outside Gujarat - IGST)",
        "items": [
            {
                "description": "Sequential CNG Gas Conversion Kit & Venturi Regulator",
                "quantity": 8.0,
                "unit_price": 16200.0,
                "total": 129600.0
            },
            {
                "description": "Digital Speedometer & Meter Console Dashboard Cluster",
                "quantity": 12.0,
                "unit_price": 2400.0,
                "total": 28800.0
            }
        ],
        "subtotal": 158400.0,
        "discount_amount": 3400.0,
        "tax_percent": 18.0,
        "taxable_amount": 155000.0,
        "cgst_amount": 0.0,
        "sgst_amount": 0.0,
        "igst_amount": 27900.0,
        "amount": 182900.0,
        "amount_paid": 0.0,
        "balance_due": 182900.0,
        "status": "Pending",
        **base_bank,
        "notes": "Consignment dispatched via Jaipur Golden Transport (Docket #JG-91823)."
    },
    {
        "invoice_number": "INV-2026-0006",
        "client": "Green City E-Auto & Rickshaw Agency",
        "customer_phone": "+91 94150 78923",
        "customer_gst": "09AAACG5432B1Z8",
        "customer_email": "greencityeauto@yahoo.com",
        "customer_address": "Block C-5, Transport Nagar, Kanpur, Uttar Pradesh 208023",
        "date": (datetime.now() - timedelta(days=35)).strftime("%Y-%m-%d"),
        "payment_terms": "15 Days",
        "payment_terms_days": 15,
        "due_date": (datetime.now() - timedelta(days=20)).strftime("%Y-%m-%d"),
        "payment_method": "Cheque",
        "place_of_supply": "Inter-State (Outside Gujarat - IGST)",
        "items": [
            {
                "description": "Auto Rickshaw Heavy-Duty Tubular Chassis Frame",
                "quantity": 5.0,
                "unit_price": 18500.0,
                "total": 92500.0
            },
            {
                "description": "200cc 4-Stroke CNG/Petrol Engine & Gearbox Assembly",
                "quantity": 3.0,
                "unit_price": 34500.0,
                "total": 103500.0
            }
        ],
        "subtotal": 196000.0,
        "discount_amount": 4000.0,
        "tax_percent": 18.0,
        "taxable_amount": 192000.0,
        "cgst_amount": 0.0,
        "sgst_amount": 0.0,
        "igst_amount": 34560.0,
        "amount": 226560.0,
        "amount_paid": 50000.0,
        "balance_due": 176560.0,
        "status": "Overdue",
        **base_bank,
        "notes": "Payment overdue by 20 days. Notice sent via email and phone follow-up on 3rd Nov."
    },
    {
        "invoice_number": "INV-2026-0007",
        "client": "Malwa Three-Wheeler Logistics & Spares",
        "customer_phone": "+91 97520 48291",
        "customer_gst": "23AAACM7412P1ZL",
        "customer_email": "malwa.transport.spares@gmail.com",
        "customer_address": "12/A Sanwer Road Industrial Area, Sector C, Indore, Madhya Pradesh 452015",
        "date": (datetime.now() - timedelta(days=2)).strftime("%Y-%m-%d"),
        "payment_terms": "Immediate",
        "payment_terms_days": 0,
        "due_date": (datetime.now() - timedelta(days=2)).strftime("%Y-%m-%d"),
        "payment_method": "UPI",
        "place_of_supply": "Inter-State (Outside Gujarat - IGST)",
        "items": [
            {
                "description": "Heavy-Duty Rear Differential Axle Assembly",
                "quantity": 4.0,
                "unit_price": 14800.0,
                "total": 59200.0
            },
            {
                "description": "Front Telescopic Fork & Hydraulic Dual Spring Suspension",
                "quantity": 4.0,
                "unit_price": 6800.0,
                "total": 27200.0
            }
        ],
        "subtotal": 86400.0,
        "discount_amount": 1400.0,
        "tax_percent": 18.0,
        "taxable_amount": 85000.0,
        "cgst_amount": 0.0,
        "sgst_amount": 0.0,
        "igst_amount": 15300.0,
        "amount": 100300.0,
        "amount_paid": 100300.0,
        "balance_due": 0.0,
        "status": "Paid",
        **base_bank,
        "notes": "Counter sale with spot UPI payment Ref: UPI/20261103/928410294."
    }
]
res_inv = db.invoices.insert_many(invoices_data)
print(f"Invoices: inserted {len(res_inv.inserted_ids)} detailed GST tax invoices.")

print("\n==============================================")
print("REAL-WORLD MANUFACTURING ERP DATASET SEEDED")
print("==============================================")
