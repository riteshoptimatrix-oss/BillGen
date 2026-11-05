import os
import shutil
import pymongo
from datetime import datetime, timedelta

# Source images from brain folder
images_source = {
    "chassis": r"C:\Users\Lenovo\.gemini\antigravity\brain\ff3cc410-70b9-46f8-b44a-8003ebc57841\auto_rickshaw_chassis_frame_1793853201228.jpg",
    "engine": r"C:\Users\Lenovo\.gemini\antigravity\brain\ff3cc410-70b9-46f8-b44a-8003ebc57841\auto_rickshaw_engine_assembly_1793853219202.jpg",
    "differential": r"C:\Users\Lenovo\.gemini\antigravity\brain\ff3cc410-70b9-46f8-b44a-8003ebc57841\auto_rickshaw_rear_axle_differential_1793853237265.jpg",
    "suspension": r"C:\Users\Lenovo\.gemini\antigravity\brain\ff3cc410-70b9-46f8-b44a-8003ebc57841\auto_rickshaw_front_suspension_fork_1793853256229.jpg",
    "cabin": r"C:\Users\Lenovo\.gemini\antigravity\brain\ff3cc410-70b9-46f8-b44a-8003ebc57841\auto_rickshaw_cabin_body_frame_1793853275667.jpg"
}

# Ensure destination upload directories
dest_dir_backend = os.path.abspath(os.path.join(os.path.dirname(__file__), "uploads"))
dest_dir_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "uploads"))
os.makedirs(dest_dir_backend, exist_ok=True)
os.makedirs(dest_dir_root, exist_ok=True)

copied_urls = {}

for key, src_path in images_source.items():
    filename = f"auto_rickshaw_{key}.jpg"
    dest_path_backend = os.path.join(dest_dir_backend, filename)
    dest_path_root = os.path.join(dest_dir_root, filename)
    shutil.copyfile(src_path, dest_path_backend)
    shutil.copyfile(src_path, dest_path_root)
    copied_urls[key] = f"http://localhost:8000/uploads/{filename}"
    print(f"Copied {filename} -> {copied_urls[key]}")

# Connect to MongoDB
client = pymongo.MongoClient("mongodb://localhost:27017")
db = client["bill_generator_db"]

# 1. Clear existing products (if any) and insert 5 authentic Auto Rickshaw Manufacturing products
db.products.delete_many({})

products_data = [
    {
        "name": "Auto Rickshaw Heavy-Duty Tubular Chassis Frame",
        "description": "High-tensile mild steel tubular chassis engineered for 3-wheeler auto rickshaw manufacturing. Anti-corrosive electrophoretic primer coated, precision MIG welded with reinforced engine cradle and rear axle brackets.",
        "image": copied_urls["chassis"],
        "price": 18500.0,
        "stock": 42
    },
    {
        "name": "200cc 4-Stroke CNG/Petrol Engine & Gearbox Assembly",
        "description": "Single-cylinder 4-stroke forced-air-cooled 198.6cc engine unit with integrated 4-speed manual constant mesh transmission gearbox, reverse gear mechanism, and electronic CDI ignition system.",
        "image": copied_urls["engine"],
        "price": 34500.0,
        "stock": 24
    },
    {
        "name": "Heavy-Duty Rear Differential Axle Assembly",
        "description": "Precision-machined rear differential axle with hypoid crown wheel & pinion gear set, hardened axle shafts, and integrated hydraulic drum brake hub assemblies designed for heavy payload 3-wheeler commercial vehicles.",
        "image": copied_urls["differential"],
        "price": 14800.0,
        "stock": 38
    },
    {
        "name": "Front Telescopic Fork & Hydraulic Dual Spring Suspension",
        "description": "Heavy-duty front suspension fork assembly equipped with dual helical coil springs, chrome hydraulic shock absorber dampers, reinforced steering stem, and precision wheel axle mounting brackets.",
        "image": copied_urls["suspension"],
        "price": 6800.0,
        "stock": 55
    },
    {
        "name": "Auto Rickshaw Sheet Metal Cabin Body & Canopy Hood",
        "description": "High-grade pressed CRCA steel driver cowl and passenger seating frame featuring signature automotive gloss yellow finish, reinforced roll cage pillars, and heavy-duty waterproof UV-resistant Rexine canvas canopy roof.",
        "image": copied_urls["cabin"],
        "price": 23500.0,
        "stock": 8  # Low stock (<10) so it naturally triggers a realistic dashboard alert
    }
]

result = db.products.insert_many(products_data)
print(f"Successfully inserted {len(result.inserted_ids)} products into MongoDB.")

# 2. Add realistic Auto Rickshaw Manufacturing Customers
db.customers.delete_many({})
customers_data = [
    {
        "name": "Gujarat Auto Spares & Body Works",
        "mobile_number": "+91 98250 14829",
        "delivery_address": "Plot 42, GIDC Industrial Estate, Odhav, Ahmedabad, Gujarat 382415"
    },
    {
        "name": "Jai Hind Three-Wheeler Motors",
        "mobile_number": "+91 98765 43210",
        "delivery_address": "Shop 14, Auto Market, Near Swargate Bus Station, Pune, Maharashtra 411002"
    },
    {
        "name": "Royal Auto Engineering Works",
        "mobile_number": "+91 91234 56789",
        "delivery_address": "Plot 18/B, Peenya Industrial Area Phase-2, Bengaluru, Karnataka 560058"
    },
    {
        "name": "Bajrang Auto Fleet & Body Builders",
        "mobile_number": "+91 99887 76655",
        "delivery_address": "Ring Road No. 2, Transport Nagar, Jaipur, Rajasthan 302013"
    },
    {
        "name": "Green City E-Auto & Rickshaw Agency",
        "mobile_number": "+91 94150 78923",
        "delivery_address": "Block C-5, Transport Nagar, Kanpur, Uttar Pradesh 208023"
    }
]
db.customers.insert_many(customers_data)
print("Successfully inserted 5 Auto Rickshaw customers.")

# 3. Add factory labours
db.labours.delete_many({})
labours_data = [
    {
        "name": "Rameshwar Patel",
        "mobile_number": "+91 98241 12345",
        "address": "Bapunagar, Ahmedabad",
        "salary": 24000.0,
        "image": "",
        "aadhar_image": ""
    },
    {
        "name": "Sunil Kumar Vishwakarma",
        "mobile_number": "+91 97234 56789",
        "address": "Vatva GIDC, Ahmedabad",
        "salary": 26500.0,
        "image": "",
        "aadhar_image": ""
    },
    {
        "name": "Manojbhai Parmar",
        "mobile_number": "+91 96385 27410",
        "address": "Odhav Industrial Area, Ahmedabad",
        "salary": 21000.0,
        "image": "",
        "aadhar_image": ""
    },
    {
        "name": "Deepak Yadav",
        "mobile_number": "+91 95123 48765",
        "address": "Changodar, Ahmedabad",
        "salary": 22500.0,
        "image": "",
        "aadhar_image": ""
    }
]
db.labours.insert_many(labours_data)
print("Successfully inserted 4 factory labours.")

# 4. Add invoices to populate dashboard analytics
db.invoices.delete_many({})
invoices_data = [
    {
        "client": "Gujarat Auto Spares & Body Works",
        "amount": 185000.0,
        "status": "Paid",
        "date": (datetime.now() - timedelta(days=5)).strftime("%Y-%m-%d")
    },
    {
        "client": "Jai Hind Three-Wheeler Motors",
        "amount": 276000.0,
        "status": "Paid",
        "date": (datetime.now() - timedelta(days=12)).strftime("%Y-%m-%d")
    },
    {
        "client": "Bajrang Auto Fleet & Body Builders",
        "amount": 92500.0,
        "status": "Pending",
        "date": (datetime.now() - timedelta(days=2)).strftime("%Y-%m-%d")
    },
    {
        "client": "Green City E-Auto & Rickshaw Agency",
        "amount": 138000.0,
        "status": "Overdue",
        "date": (datetime.now() - timedelta(days=25)).strftime("%Y-%m-%d")
    }
]
db.invoices.insert_many(invoices_data)
print("Successfully inserted real invoices.")

# 5. Add manufacturing factory expenses
db.expenses.delete_many({})
expenses_data = [
    {
        "description": "Seamless Tubular Mild Steel Pipe Batch (Grade IS:1239)",
        "amount": 145000.0,
        "date": (datetime.now() - timedelta(days=20)).strftime("%Y-%m-%d")
    },
    {
        "description": "MIG Welding Argon Gas & Wire Spools",
        "amount": 28000.0,
        "date": (datetime.now() - timedelta(days=15)).strftime("%Y-%m-%d")
    },
    {
        "description": "Industrial Electrophoretic Paint & Primer Batch",
        "amount": 38500.0,
        "date": (datetime.now() - timedelta(days=10)).strftime("%Y-%m-%d")
    },
    {
        "description": "Factory Electricity & Machinery Maintenance",
        "amount": 42000.0,
        "date": (datetime.now() - timedelta(days=3)).strftime("%Y-%m-%d")
    }
]
db.expenses.insert_many(expenses_data)
print("Successfully inserted factory expenses.")

print("\n--- ALL DATA SEEDED SUCCESSFULLY ---")

