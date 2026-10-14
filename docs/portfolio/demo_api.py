"""Local product-management demo: original routes/services, isolated SQLite data.

Run from server/: python ../docs/portfolio/demo_api.py
Not a full MySQL deployment. Other application modules are outside this demo.
"""
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'server'))
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.database import get_db
from app.core.security import get_password_hash
from app.models.admin_user import AdminUser
from app.models.billing_product import BillingProduct
from app.schemas.billing import BillingProductCreateRequest
from app.services.billing_product import create_admin_product
from app.api.admin.auth import router as auth_router
from app.api.admin.billing import router as products_router
from app.api.public.billing import router as public_products_router

engine = create_engine('sqlite:///' + str(Path(__file__).with_name('demo.sqlite3')), connect_args={'check_same_thread': False})
AdminUser.__table__.create(engine, checkfirst=True)
BillingProduct.__table__.create(engine, checkfirst=True)
Session = sessionmaker(bind=engine)
with Session() as db:
    if not db.query(AdminUser).filter_by(username='portfolio').first():
        db.add(AdminUser(username='portfolio', password_hash=get_password_hash('PortfolioDemo2026'), name='作品演示管理员', status=1))
        db.commit()
    if db.query(BillingProduct).count() == 0:
        for i, (name, price) in enumerate([('演示商品：数据采集套餐', '199.00'), ('演示商品：API 调用套餐', '299.00'), ('演示商品：报表生成套餐', '399.00')], 1):
            create_admin_product(db, BillingProductCreateRequest(product_code=f'DEMO_{i}', service_code=f'SVC_{i}', service_name=name, supplier_name='演示供应商（非真实客户）', name=name, billing_mode='PREPAID', price=price, sort_order=i, status='ON_SALE'), 1)

def demo_db():
    with Session() as db:
        yield db

app = FastAPI(title='Portfolio demo — product management only')
app.add_middleware(CORSMiddleware, allow_origins=['http://127.0.0.1:3211'], allow_credentials=True, allow_methods=['*'], allow_headers=['*'])
app.dependency_overrides[get_db] = demo_db
app.include_router(auth_router, prefix='/api/admin/auth')
app.include_router(products_router, prefix='/api/admin')
app.include_router(public_products_router, prefix='/api/public')

if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host='127.0.0.1', port=8211)
