from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List
import uuid
from datetime import datetime, timezone
import google.generativeai as genai

# Configure logging early so logger is available everywhere
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")  # Ignore MongoDB's _id field
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

class CollegeRequest(BaseModel):
    college_name: str

class CollegeReportResponse(BaseModel):
    report: str

# College evaluation prompt template
PROMPT_TEMPLATE = """Using the schema below, give a **concise, one-line answer per field** for the college: {college_name} .  
Format every item exactly as shown in the template - keep the exact KPI names as given (e.g., "Number of laboratories", "Placement Rate", etc.) and fill in the values:
 
`<KPI Name>: <Exact Value> | Source: <EXACT URL>`
 
CRITICAL ACCURACY & CROSS-VALIDATION REQUIREMENTS:

1. DATA SOURCE PRIORITY (in order):
   PRIORITY 1 - Official College Website (HIGHEST PRIORITY):
   - Search "{college_name} official website"
   - Find placement page, infrastructure page, research page
   - Use data directly from college's own website first
   
   PRIORITY 2 - Government/Regulatory Portals:
   - NIRF India (nirfindia.org) - Rankings, Placements, Research
   - NAAC Portal (naac.gov.in) - Accreditation grades
   - NBA Portal (nbaind.org) - Program accreditation
   - AICTE Mandatory Disclosure
   
   PRIORITY 3 - Education Portals (for cross-validation):
   - CollegeDunia (collegedunia.com)
   - Shiksha (shiksha.com)
   - CollegeVidya (collegevidya.com)
   - Careers360 (careers360.com)

2. MANDATORY CROSS-VALIDATION:
   - For each KPI, search at least 2-3 sources
   - Compare data across: Official Website + NIRF/NAAC + CollegeDunia/Shiksha
   - If data matches across sources, report with confidence
   - If data differs, prefer Official Website > NIRF/NAAC > Education Portals
   - Note discrepancies with "(verified)" or "(cross-checked)"

3. SEARCH PROCESS:
   Step 1: Search "{college_name} official website placements infrastructure"
   Step 2: Search "{college_name} NIRF ranking 2024"
   Step 3: Search "{college_name} CollegeDunia" for validation
   Step 4: Search "{college_name} Shiksha" for validation
   Step 5: Compare and use the most reliable, consistent data

4. URL FORMAT - Provide REAL URLs from search:
   - Official Website: https://collegename.edu.in/specific-page
   - NIRF: https://www.nirfindia.org/...
   - CollegeDunia: https://collegedunia.com/college/...
   - Shiksha: https://www.shiksha.com/college/...
   - CollegeVidya: https://www.collegevidya.com/college/...

5. DATA ACCURACY:
   - Use EXACT numbers (not rounded unless marked)
   - Include YEAR in value (e.g., "85% (2024)")
   - Mark cross-validated data with "(verified)"
   - If data unavailable, write "Data Not Available"
   - If URL not found, use: "Search: {college_name} + keyword"
 
Do NOT add extra explanation, bullets, or paragraphs. Do NOT replace the KPI names with generic text like "KPI".
 
---
 
# College Evaluation (Compact)
 
College Name: {college_name}  
Primary Data Sources Used: <list of specific recent reports>
 
---
 
## 1. Infrastructure & Sustainability (Source: Search "Mandatory Disclosure", "NAAC SSR", "Website")
 
Number of laboratories: <Exact Count> | Source: <...>  
Number of classrooms: <Exact Count> | Source: <...>  
ICT-enabled learning units: <Exact Count> | Source: <...>  
Workshops capacity: <Exact Capacity> | Source: <...>  
Computer availability: <Exact Count> | Source: <...>  
Number of physical books: <Exact Count> | Source: <...>  
Subscription to academic journals: <Exact Count> | Source: <...>  
E-resources available: <Exact Count> | Source: <...>  
Digital library access: <Yes/No> | Source: <...>  
Library automation / ILMS: <Name/Version> | Source: <...>  
Hostel accommodation capacity: <Exact Bed Count> | Source: <...>  
Safety & security budget: <Exact Amount> | Source: <...>  
Hygiene & sanitation standards: <Rating> | Source: <...>  
Food quality & mess facilities: <Rating> | Source: <...>  
Recreation & common facilities: <Exact Count> | Source: <...>  
Smart campus / ERP implementation: <Name/Status> | Source: <...>  
Solar energy capacity: <Exact KW/MW> | Source: <...>  
Water recycling capacity: <Exact Liters> | Source: <...>  
Sustainability initiatives: <Exact Count> | Source: <...>  
 
---
 
## 2. Graduate Outcome & Employability (Source: Search "NIRF Report 2024", "AICTE Placement Data")
 
Placement Rate: <Exact %> | Source: <...>  
Median Salary: <Exact Amount in INR/USD> | Source: <...>  
Higher Education Rate: <Exact %> | Source: <...>  
 
---
 
## 3. Innovation, Startup & IP (Source: Search "IIC Ranking", "ARIIA", "Startup Policy")
 
Incubated Startups: <Exact Count> | Source: <...>  
Funding Raised: <Exact Amount> | Source: <...>  
IP Patents Granted: <Exact Count> | Source: <...>  
TRL progression: <Current Level> | Source: <...>  
 
---
 
## 4. Research Quality & Impact Output (Source: Search "Scopus", "Vidwan", "IPO Website")
 
Scopus Publications: <Exact Count> | Source: <...>  
Citations: <Exact Count> | Source: <...>  
Sponsored Research Value: <Exact Amount> | Source: <...>  
Research Collaborations: <Exact Count> | Source: <...>  
 
---
 
## 5. Admissions (Quality & Diversity) (Source: Search "Counselling Portals", "Seat Matrix", "Cutoff")
 
Entry Cut-off (JEE/CAT/etc): <Exact Rank/Score> | Source: <...>  
Female Enrollment: <Exact %> | Source: <...>  
Out-of-State Students: <Exact %> | Source: <...>  
Admission Demand Ratio: <Exact Ratio> | Source: <...>  
 
---
 
## 6. Industry Integration (Source: Search "MoUs", "Industry Report", "Annual Report")
 
Active MoUs: <Exact Count> | Source: <...>  
Outcome-Based MoUs: <Exact %> | Source: <...>  
Reputed Industry Partners: <Exact Count> | Source: <...>  
Joint Research Projects: <Exact Count> | Source: <...>  
Industry-Led FDPs: <Exact Count> | Source: <...>  
Joint Certifications: <Exact Count> | Source: <...>  
Visiting Industry Experts: <Exact Count> | Source: <...>  
Industry Co-Taught Courses: <Exact %> | Source: <...>  
Adjunct Industry Faculty: <Exact Count> | Source: <...>  
Certification-Based Credits: <Exact %> | Source: <...>  
Industry Representation in BoS: <Yes/No> | Source: <...>  
Industry-Aligned Curriculum Updates: <Frequency> | Source: <...>  
Industry-Evaluated Projects: <Exact %> | Source: <...>  
 
---
 
## 7. Teaching and Learning Environment (Source: Search "NIRF", "Faculty Profile", "Mandatory Disclosure")
 
PhD Faculty: <Exact %> | Source: <...>  
Avg Faculty Experience: <Exact Years> | Source: <...>  
Student–Faculty Ratio: <Exact Ratio> | Source: <...>  
Papers per Faculty: <Exact Count> | Source: <...>  
Faculty Attending FDPs: <Exact %> | Source: <...>  
Faculty with Certifications: <Exact %> | Source: <...>  
Faculty Awards: <Exact %> | Source: <...>  
Pass Rate: <Exact %> | Source: <...>  
 
---
 
## 8. Student Experience and Well-Being (Source: Search "IQAC Report", "AQAR", "Website")
 
Sports Facilities Area: <Exact Sq Ft/Acres> | Source: <...>  
Tournaments Organized: <Exact Count> | Source: <...>  
Sports Achievements: <Exact Count> | Source: <...>  
Active Clubs: <Exact Count> | Source: <...>  
 
---
 
## 9. Internationalization & Global Reputation (Source: Search "NAAC", "NIRF Outreach", "International Relations")
 
International Students Percentage: <Exact %> | Source: <...>  
Faculty Exchange Programs: <Exact Count> | Source: <...>  
International Reputation: <QS/THE Rank or Description> | Source: <...>  
 
---
 
## 10. Quality Assurance and NEP Implementation (Source: Search "NAAC", "NBA", "NIRF", "UGC Portal")
 
NAAC Accreditation Grade: <Grade & CGPA> | Source: <...>  
NBA Accreditation: <% Programs Accredited> | Source: <...>  
NIRF Ranking: <Rank> | Source: <...>  
Institutional Status: <Autonomous/Deemed/Affiliated> | Source: <...>  
BoS (Board of Studies): <Active/Functional/Minimal/Non-functional> | Source: <...>  
Decision-making Autonomy: <Full/Partial/Limited/None> | Source: <...>  
Digital Governance: <Fully Digital/Partial/Limited/Manual> | Source: <...>  
Multidisciplinary Curriculum: <Fully Integrated/Partial/Minimal/None> | Source: <...>  
ABC (Academic Bank of Credits): <Full/Partial/Early/Not Adopted> | Source: <...>  
FY Foundation Course: <Fully/Partially/Limited/Not Implemented> | Source: <...>  
OBE (Outcome-Based Education): <Fully/Partially/Early/Not Implemented> | Source: <...>  
Internships Integration: <Mandatory/Optional/Limited/None> | Source: <...>  
Value-Added Courses: <Multiple/Some/Few/None> | Source: <...>  
4-Year UG Design: <Fully/Mostly/Pilot/Not Implemented> | Source: <...>  
"""

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Hello World"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    
    # Convert to dict and serialize datetime to ISO string for MongoDB
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    
    _ = await db.status_checks.insert_one(doc)
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    # Exclude MongoDB's _id field from the query results
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    
    # Convert ISO string timestamps back to datetime objects
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    
    return status_checks

@api_router.post("/generate-college-report", response_model=CollegeReportResponse)
async def generate_college_report(data: CollegeRequest):
    """Generate comprehensive college evaluation report using AI"""
    if not data.college_name:
        raise HTTPException(status_code=400, detail="College name is required")
    
    try:
        # Get API key from environment
        api_key = os.environ.get('GOOGLE_API_KEY')
        if not api_key:
            raise HTTPException(status_code=500, detail="API key not configured")
        
        # Configure Google Generative AI
        genai.configure(api_key=api_key)
        
        # Format the prompt with college name
        formatted_prompt = PROMPT_TEMPLATE.format(college_name=data.college_name)
        
        # Initialize Gemini model
        try:
            # Use Gemini 3 Flash with Google Search grounding for real-time data
            model = genai.GenerativeModel(
                model_name="models/gemini-3-flash-preview",
                tools="google_search_retrieval",
                system_instruction="""You are a Senior Strategic Consultant and Data Auditor specializing in Indian Higher Education Institutions.
            
CORE MISSION: Provide PRECISE, CROSS-VALIDATED DATA with EXACT URLs. Official College Website data has HIGHEST PRIORITY.

MANDATORY CROSS-VALIDATION PROCESS:
For EVERY data point, you MUST:
1. FIRST search the college's OFFICIAL WEBSITE for the data
2. THEN verify with NIRF/NAAC/NBA official portals
3. FINALLY cross-check with CollegeDunia, Shiksha, CollegeVidya
4. Use data that is CONSISTENT across multiple sources
5. Prefer Official Website data when sources conflict

DATA SOURCE PRIORITY (Strictly Follow):
1. 🥇 OFFICIAL COLLEGE WEBSITE (collegename.edu.in) - HIGHEST PRIORITY
   - Placements page, Infrastructure page, About Us, Research
2. 🥈 GOVERNMENT PORTALS:
   - NIRF India (nirfindia.org)
   - NAAC Portal (naac.gov.in)
   - NBA Portal (nbaind.org)
   - AICTE Mandatory Disclosure
3. 🥉 EDUCATION PORTALS (for validation only):
   - CollegeDunia (collegedunia.com)
   - Shiksha (shiksha.com)
   - CollegeVidya (collegevidya.com)
   - Careers360 (careers360.com)

SEARCH SEQUENCE FOR EACH COLLEGE:
1. Search: "[college name] official website"
2. Search: "[college name] placements 2024 site:collegename.edu.in"
3. Search: "[college name] NIRF 2024"
4. Search: "[college name] collegedunia"
5. Search: "[college name] shiksha"
6. Compare data from all sources

VALIDATION RULES:
- If Official Website has data → Use it (mark as "verified")
- If Official Website missing but NIRF/NAAC has data → Use NIRF/NAAC
- If only education portals have data → Use with "(from CollegeDunia)" note
- If data conflicts → Prefer: Official > NIRF > CollegeDunia > Shiksha

STRICT RULES:
1. ONLY use URLs found through actual Google Search
2. Include YEAR in values (e.g., "85% (2024)")
3. Mark validated data with "(verified)" when confirmed across 2+ sources
4. If data unavailable after searching all sources: "Data Not Available"
5. NEVER fabricate URLs or data
"""
            )
            
            # Get response from AI
            response = model.generate_content(formatted_prompt)
            
        except Exception as search_error:
            logger.warning(f"Primary model failed, falling back: {str(search_error)}")
            # Fallback model
            model = genai.GenerativeModel(
                model_name="models/gemini-3-flash-preview",
                system_instruction="""You are a Senior Strategic Consultant and Data Auditor specializing in Indian Higher Education.

RULES:
1. Report data you are confident about from your training
2. Mark uncertain data with "(approx)"
3. For unknown metrics, write "Data Not Available"
4. Include year of data when known
5. Source format: "NIRF 2023" or "NAAC SSR" or "Official Website"
6. DO NOT fabricate specific numbers - be honest about uncertainty
"""
            )
            response = model.generate_content(formatted_prompt)
        
        if not response or not response.text:
            return CollegeReportResponse(report="No data found for this college.")
        
        return CollegeReportResponse(report=response.text)
        
    except Exception as e:
        logger.error(f"Error generating college report: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating report: {str(e)}")

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()