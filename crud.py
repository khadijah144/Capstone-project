from fastapi import FastAPI
from pydantic import BaseModel, ConfigDict
from sqlalchemy import create_engine, Column, Integer, String, Boolean
from sqlalchemy.orm import declarative_base, sessionmaker
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATABASE_URL = "sqlite:///./todo.db"
engine = create_engine(
    DATABASE_URL,
    connect_args = {"check_same_thread":False})

Base = declarative_base()
SessionLocal = sessionmaker(
    autocommit = False,
    autoflush = False,
    bind=engine
)

class TaskDB(Base):
    __tablename__="tasks"
    id=Column(Integer, primary_key=True)
    title=Column(String)
    is_done=Column(Boolean, default=False)
Base.metadata.create_all(bind=engine)

class Task(BaseModel):
    id:int
    title:str
    is_done:bool=False

    model_config = ConfigDict(from_attributes=True)

@app.post("/tasks")
def create_task(task:Task):
    db = SessionLocal()
    new_task = TaskDB(
        id = task.id,
        title = task.title,
        is_done = task.is_done
    )
    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    db.close()

@app.get("/tasks", response_model=list[Task])
def get_task():
    db =SessionLocal()
    tasks = db.query(TaskDB).all()
    db.close()
    return tasks

@app.put("/tasks/{task_id}")
def update_task(task_id: int, task: Task):
    db = SessionLocal()

    existing_task = db.query(TaskDB).filter(TaskDB.id == task_id).first() #checks if the task exist.

    if existing_task:                                               #if the task exist, the user input the new data and it updates it.
        existing_task.title = task.title
        existing_task.is_done = task.is_done

        db.commit()
        db.refresh(existing_task)
        db.close()

        return existing_task

    db.close()

    return {"message": "Task not found"}                            #otherwise it shows this.

@app.delete("/tasks/{task_id}")
def delete_task(task_id: int):
    db = SessionLocal()

    task = db.query(TaskDB).filter(TaskDB.id == task_id).first()  #checks if the task exist. 

    if task:                                                      #if exists, deletes it.
        db.delete(task)
        db.commit()
        db.close()

        return {"message": "Task deleted"}

    db.close()

    return {"message": "Task not found"}                          #if not, Displays this.
