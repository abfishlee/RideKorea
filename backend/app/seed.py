import asyncio

from geoalchemy2.shape import from_shape
from shapely.geometry import LineString, Point
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from .database import AsyncSessionLocal
from .models import Course, Spot, TravelPoi

# Major certification centers along the Seoul-Busan cross-country route.
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
    {"name": "문경 불정역", "name_en": "Mungyeong Buljeong Station", "lat": 36.643333, "lng": 128.169167},
    {"name": "상주 상풍교", "name_en": "Sangju Sangpung Bridge", "lat": 36.523056, "lng": 128.271389},
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
    {"name": "낙동강하구둑", "name_en": "Nakdong River Estuary Bank", "lat": 35.109722, "lng": 128.943056},
]

SAMPLE_TRAVEL_POIS = [
    {
        "external_id": "demo-poi-incheon-airport-bike-transfer",
        "name": "인천공항 자전거 입국 준비",
        "name_en": "Incheon Airport Bike Arrival Prep",
        "category": "transport",
        "lat": 37.4602,
        "lng": 126.4407,
        "description": (
            "공항 도착 후 자전거 박스 파손 여부를 확인하고, 공항철도/택시/밴 이동 가능성을 비교하는 데모 가이드입니다. "
            "아라서해갑문으로 바로 이동하려면 대형 수하물 이동 수단과 조립 가능한 실내외 공간을 먼저 확인하세요."
        ),
        "description_en": (
            "Demo guide for checking bike-box damage after arrival and comparing airport rail, taxi, or van transfer options. "
            "If heading straight to Ara West Sea Lock, confirm oversized-luggage transport and a safe assembly space first."
        ),
        "address": "인천국제공항 제1여객터미널",
        "phone": None,
    },
    {
        "external_id": "demo-poi-ara-repair",
        "name": "아라 라이더 수리 스테이션",
        "name_en": "Ara Rider Repair Station",
        "category": "repair",
        "lat": 37.5619,
        "lng": 126.6011,
        "description": "출발 전 공기압, 튜브, 브레이크를 빠르게 점검하기 좋은 데모 수리 지점입니다.",
        "description_en": "Demo repair stop for a quick tire, tube, and brake check before departure.",
        "address": "인천 서구 정서진 인근",
        "phone": "032-000-0001",
    },
    {
        "external_id": "demo-poi-ara-start-transfer",
        "name": "아라서해갑문 출발지 이동 팁",
        "name_en": "Ara West Sea Lock Start Transfer Tip",
        "category": "transport",
        "lat": 37.5598,
        "lng": 126.5995,
        "description": (
            "공항에서 바로 출발지로 이동한 뒤 자전거를 조립하고 보급품을 정리하는 데모 팁입니다. "
            "바람이 강한 날에는 조립 공간과 첫 보급 지점을 미리 확인하세요."
        ),
        "description_en": (
            "Demo tip for transferring from the airport to the start point, assembling the bike, and organizing supplies. "
            "On windy days, check assembly space and the first resupply point in advance."
        ),
        "address": "인천 서구 정서진 아라서해갑문 인근",
        "phone": None,
    },
    {
        "external_id": "demo-poi-seoul-station-ktx-bike",
        "name": "서울역 열차 이동 체크",
        "name_en": "Seoul Station Train Transfer Check",
        "category": "transport",
        "lat": 37.5547,
        "lng": 126.9707,
        "description": (
            "열차로 점프 이동하거나 비상 복귀할 때 확인할 데모 가이드입니다. "
            "자전거는 포장 상태, 열차 종류, 시간대에 따라 탑승 조건이 달라질 수 있으므로 예매 전 규정을 확인하세요."
        ),
        "description_en": (
            "Demo guide for train transfers or emergency returns. "
            "Bike boarding rules can vary by packing method, train type, and time slot, so check policy before booking."
        ),
        "address": "서울 중구 한강대로 405",
        "phone": None,
    },
    {
        "external_id": "demo-poi-yeouido-food",
        "name": "여의도 라이더 국수",
        "name_en": "Yeouido Rider Noodles",
        "category": "food",
        "lat": 37.5318,
        "lng": 126.9216,
        "description": "한강 구간을 지난 뒤 탄수화물을 보충하기 좋은 데모 맛집입니다.",
        "description_en": "Demo food stop for a carb refill after the Hangang section.",
        "address": "서울 영등포구 여의도 한강공원 인근",
        "phone": "02-000-0002",
    },
    {
        "external_id": "demo-poi-suanbo-lodging",
        "name": "수안보 라이더 게스트하우스",
        "name_en": "Suanbo Rider Guesthouse",
        "category": "lodging",
        "lat": 36.844,
        "lng": 127.9732,
        "description": "이화령을 넘기 전 하루 쉬어가기 좋은 데모 숙소입니다.",
        "description_en": "Demo lodging option before climbing Ihwaryeong Pass.",
        "address": "충북 충주시 수안보면 온천리",
        "phone": "043-000-0003",
    },
    {
        "external_id": "demo-poi-ihwaryeong-scenic",
        "name": "이화령 전망 포인트",
        "name_en": "Ihwaryeong Scenic Point",
        "category": "scenic",
        "lat": 36.7626,
        "lng": 128.027,
        "description": "힘든 업힐 뒤 사진을 남기기 좋은 데모 전망 지점입니다.",
        "description_en": "Demo scenic stop for photos after the climb.",
        "address": "충북 괴산군 연풍면 이화령로",
        "phone": None,
    },
    {
        "external_id": "demo-poi-mungyeong-culture",
        "name": "문경 옛길 문화 쉼터",
        "name_en": "Mungyeong Old Road Culture Stop",
        "category": "culture",
        "lat": 36.6418,
        "lng": 128.168,
        "description": "라이딩 중 짧게 지역 이야기를 만날 수 있는 데모 문화 지점입니다.",
        "description_en": "Demo culture stop for a quick local-history break.",
        "address": "경북 문경시 불정동 인근",
        "phone": None,
    },
    {
        "external_id": "demo-poi-busan-transport",
        "name": "부산 자전거 복귀 교통 팁",
        "name_en": "Busan Bike Return Transport Tip",
        "category": "transport",
        "lat": 35.111,
        "lng": 128.9445,
        "description": (
            "종주 완료 후 자전거 포장, 공항 이동, 열차 이동을 점검하는 데모 교통 지점입니다. "
            "복귀 당일에는 포장재 확보, 터미널 이동 시간, 대형 수하물 접수 시간을 여유 있게 잡으세요."
        ),
        "description_en": (
            "Demo transport tip for packing bikes and leaving Busan after the ride. "
            "Leave enough time for packing materials, terminal transfer, and oversized-luggage check-in."
        ),
        "address": "부산 사하구 낙동남로 인근",
        "phone": None,
    },
]


async def seed_course_and_spots(session: AsyncSession) -> Course:
    course_check = await session.execute(
        select(Course).where(Course.name_en == "Seoul-Busan Cross-Country Route")
    )
    existing_course = course_check.scalars().first()

    if existing_course:
        print("Seoul-Busan course already exists.")
        return existing_course

    print("Seeding Seoul-Busan course and certification spots...")
    route_line = LineString([(center["lng"], center["lat"]) for center in CERTIFICATION_CENTERS])
    course = Course(
        name="서울-부산 국토종주 코스",
        name_en="Seoul-Busan Cross-Country Route",
        description="인천 아라서해갑문부터 부산 낙동강하구둑까지 이어지는 자전거 국토종주 대표 코스입니다.",
        description_en=(
            "The premier cycling cross-country route connecting Incheon's Ara West Sea Lock "
            "to Busan's Nakdong River Estuary."
        ),
        distance_km=633.00,
        estimated_days_min=5,
        estimated_days_max=8,
        difficulty="hard",
        route_geometry=from_shape(route_line, srid=4326),
    )

    session.add(course)
    await session.flush()

    for center in CERTIFICATION_CENTERS:
        spot = Spot(
            course_id=course.id,
            name=center["name"],
            name_en=center["name_en"],
            type="certification_center",
            location=from_shape(Point(center["lng"], center["lat"]), srid=4326),
            description=f"{center['name']} 인증센터",
            description_en=f"{center['name_en']} Certification Center",
        )
        session.add(spot)

    return course


async def seed_travel_pois(session: AsyncSession) -> int:
    inserted = 0

    for item in SAMPLE_TRAVEL_POIS:
        poi_check = await session.execute(
            select(TravelPoi).where(TravelPoi.external_id == item["external_id"])
        )
        if poi_check.scalars().first():
            continue
        is_transport = item["category"] == "transport"

        poi = TravelPoi(
            name=item["name"],
            name_en=item["name_en"],
            category=item["category"],
            location=from_shape(Point(item["lng"], item["lat"]), srid=4326),
            description=item["description"],
            description_en=item["description_en"],
            address=item["address"],
            phone=item["phone"],
            source="demo",
            external_id=item["external_id"],
            source_url="https://www.data.go.kr/ugs/selectPortalPolicyView.do",
            source_name="RideKorea demo dataset",
            license_type="demo",
            attribution="RideKorea demo data",
            review_status="approved",
            transport_mode=item.get("transport_mode") or ("transfer" if is_transport else None),
            route_name=item.get("route_name") or ("Korea bike transfer demo" if is_transport else None),
            bike_policy=item.get("bike_policy") or (
                "운송사와 노선별 자전거 포장 규정이 다를 수 있으므로 출발 전 공식 안내를 다시 확인하세요."
                if is_transport else None
            ),
            bike_policy_en=item.get("bike_policy_en") or (
                "Bike packing and boarding rules can vary by operator and route. Re-check official guidance before travel."
                if is_transport else None
            ),
            packing_required=item.get("packing_required") if item.get("packing_required") is not None else (True if is_transport else None),
            packing_notes=item.get("packing_notes") or (
                "대형 수하물 이동, 조립 공간, 터미널 이동 시간을 여유 있게 확인하세요."
                if is_transport else None
            ),
            packing_notes_en=item.get("packing_notes_en") or (
                "Confirm oversized-luggage handling, assembly space, and terminal transfer time."
                if is_transport else None
            ),
            booking_url=item.get("booking_url"),
            is_active=True,
        )
        session.add(poi)
        inserted += 1

    return inserted


async def seed_data():
    async with AsyncSessionLocal() as session:
        await seed_course_and_spots(session)
        inserted_pois = await seed_travel_pois(session)
        await session.commit()

        if inserted_pois:
            print(f"Successfully seeded {inserted_pois} demo travel POIs.")
        else:
            print("Demo travel POIs already exist.")


if __name__ == "__main__":
    asyncio.run(seed_data())
