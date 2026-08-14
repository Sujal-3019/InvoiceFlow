from app.database import Base, engine
from app import models


print("Dropping all tables...")

Base.metadata.drop_all(
    bind=engine
)

print("Creating all tables...")

Base.metadata.create_all(
    bind=engine
)

print("Database reset successfully.")
