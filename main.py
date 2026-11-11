from fastapi import FastAPI, HTTPException
import json
from pydantic import BaseModel
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from fastapi import FastAPI
from sqlalchemy import create_engine, Column, Integer, String
from sqlalchemy.orm import declarative_base

# Replace 'your_password' and 'your_database_name' with your exact pgAdmin details
SQLALCHEMY_DATABASE_URL = "postgresql://postgres:12345@localhost:5432/testdb"

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
class TestTable(Base):
    __tablename__ = "test"
    id = Column(Integer, primary_key=True)
    name = Column(String)

# 3. Automatically create the table in PostgreSQL
Base.metadata.create_all(bind=engine)

class Address(BaseModel):
    street: str
    city: str
    state: str
    zip_code: str

class Student(BaseModel):
    id:int
    name: str
    address: Address

app = FastAPI()
student_db = "student.json"


def get_data():
    with open(student_db, "r") as file:
        data = json.load(file)
    return data

@app.get("/")
def root():
    return {"message": "Hello, World!"}


@app.get("/students")
def get_students():
    return get_data()



@app.get("/students/{id}")
def show_student(id: str):
    data = get_data()
    if id in data:
        return data[id]
    else:
        raise HTTPException(status_code=404, detail="Student not found")
def save_data(data):
    with open(student_db, "w") as file:
        json.dump(data, file, indent=4)

@app.post("/create")
def create_student(student : Student):
    data = get_data()

    data[str(student.id)] = student.model_dump(exclude="id")
      # Assuming you have a method to convert Student to dict
    save_data(data)
    return {"message": "Student created successfully"}
    
@app.put("/update/{id}")
def update_student(id:str,student:Student):
    data=get_data()
    if id not in data:
        raise HTTPException(status_code=404, detail="Student not found")

    data[id]=student.model_dump(exclude="id")
    save_data(data)
    return {"message": "Student updated successfully"}