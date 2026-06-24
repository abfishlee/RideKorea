import asyncio
import json
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from shapely.geometry import Point, LineString
from geoalchemy2.shape import from_shape

from .database import AsyncSessionLocal, engine
from .models import Course, Spot

# Major Certification Centers along the Seoul-Busan Cross-Country Route
CERTIFICATION_CENTERS = [
    {"name": "아라서해갑문", "name_en": "Ara West Sea Lock", "lat": 37.561245, "lng": 126.598284},
    {"name": "아라한강갑문", "name_en": "Ara Hangang Lock", "lat": 37.594777, "lng": 126.801533},
    {"name": "여의도 마리나", "name_en": "Yeouido Marina", "lat": 37.533222, "lng": 126.918944},
    {"name": "뚝섬 전망문화콤플렉스", "name_en": "Ttukseom Observatory", "lat": 37.528434, "lng": 127.067332},
    {"name": "광나루 자전거공원", "name_en": "Gwangnaru Bike Park", "lat": 37.538183, "lng": 127.121876},
    {"name": "이포보", "name_en": "Ipoba", "lat": 37.399587, "lng": 127.537243},
    {"name": "여주보", "name_en": "Yeojuba", "lat": 37.319765, "lng": 127.604646},
    {"name": "강천보", "name_en": "Gangcheonba", "lat": 37.288223, "lng": 127.674998},
    {"name": "비내섬", "name_en": "Binaeseom", "lat": 37.190567, "lng": 127.784532},
    {"name": "목계교", "name_en": "Mokgyegyo", "lat": 37.072223, "lng": 127.876111},
    {"name": "탄금대", "name_en": "Tangeumdae", "lat": 36.994432, "lng": 127.900984},
    {"name": "수안보온천", "name_en": "Suanbo Hot Springs", "lat": 36.842778, "lng": 127.971944},
    {"name": "이화령 고개", "name_en": "Ihwaryeong Pass", "lat": 36.761944, "lng": 128.026389},
    {"name": "문경불정역", "name_en": "Mungyeong Buljeong Station", "lat": 36.643333, "lng": 128.169167},
    {"name": "상주상풍교", "name_en": "Sangju Sangpung Bridge", "lat": 36.523056, "lng": 128.271389},
    {"name": "상주보", "name_en": "Sangjubo", "lat": 36.388889, "lng": 128.256389},
    {"name": "낙단보", "name_en": "Nakdanbo", "lat": 36.273611, "lng": 128.286111},
    {"name": "구미보", "name_en": "Gumibo", "lat": 36.177778, "lng": 128.368056},
    {"name": "칠곡보", "name_en": "Chilgokbo", "lat": 35.986111, "lng": 128.406944},
    {"name": "강정고령보", "name_en": "Gangjeong Goryeong Gaebo", "lat": 35.845833, "lng": 128.463889},
    {"name": "달성보", "name_en": "Dalseongbo", "lat": 35.698611, "lng": 128.431944},
    {"name": "합천창녕보", "name_en": "Hapcheon Changnyeongbo", "lat": 35.536111, "lng": 128.328333},
    {"name": "적포교", "name_en": "Jeokpogyo", "lat": 35.518611, "lng": 128.384722},
    {"name": "창녕함안보", "name_en": "Changnyeong Hamanbo", "lat": 35.342778, "lng": 128.433889},
    {"name": "양산 물금", "name_en": "Yangsan Mulgeum", "lat": 35.311111, "lng": 128.986111},
    {"name": "낙동강하구둑", "name_en": "Nakdong River Estuary Bank", "lat": 35.109722, "lng": 128.943056}
]

async def seed_data():
    async with AsyncSessionLocal() as session:
        # 1. Check if course already exists
        course_check = await session.execute(
            select(Course).where(Course.name_en == "Seoul-Busan Cross-Country Route")
        )
        existing_course = course_check.scalars().first()
        
        if existing_course:
            print("Database already seeded with Seoul-Busan course.")
            return

        print("Seeding database with RideKorea sample data...")

        # 2. Create the Seoul-Busan Course
        # Generate a LineString path sequentially connecting the certification centers
        route_points = [(c["lng"], c["lat"]) for c in CERTIFICATION_CENTERS]
        route_line = LineString(route_points)
        
        seoul_busan_course = Course(
            name="서울-부산 국토종주 코스",
            name_en="Seoul-Busan Cross-Country Route",
            description="인천 아라뱃길서해갑문부터 부산 낙동강하구둑까지 이어지는 자전거 국토종주 대표 코스",
            description_en="The premier cycling cross-country route connecting Incheon's Ara West Sea Lock to Busan's Nakdong River Estuary.",
            distance_km=633.00,
            estimated_days_min=5,
            estimated_days_max=8,
            difficulty="hard",
            route_geometry=from_shape(route_line, srid=4326)
        )
        
        session.add(seoul_busan_course)
        # Flush to get the course ID
        await session.flush()

        # 3. Create Spots (Certification Centers) linked to this course
        for c in CERTIFICATION_CENTERS:
            point = Point(c["lng"], c["lat"])
            spot = Spot(
                course_id=seoul_busan_course.id,
                name=c["name"],
                name_en=c["name_en"],
                type="certification_center",
                location=from_shape(point, srid=4326),
                description=f"{c['name']} 인증센터",
                description_en=f"{c['name_en']} Certification Center"
            )
            session.add(spot)
            
        await session.commit()
        print("Successfully seeded course and spots!")

if __name__ == "__main__":
    asyncio.run(seed_data())
