# Plotline Internship Task
Backend Assignment | Plotline

## About the Backend

This project aims to create a backend system for a shoping website that first authorizes the user and then allows him to add various things to the cart , go for billing and confirm the order . It also has a admin interface to add items to the website and query various results from the database

## Key Features
- Added safety using encryption and token authorization
- Mulitilevel logging 
- Network retries in case of failure

## Tech Stack
- Node.js
- MongoDB
- Express.js
- Postman

## Major Packages used in this project

- **jwt**: Used jwt web token to create authentication tokens
- **bcrypt**: Used for encrypting and password verification 
- **dotenv**: Used to load .env file in the main program

### Getting Started

To get started:

- Clone the repo.

```shell
git clone https://github.com/harsh2274/Plotline_Task.git
```

- Change into the directory.

```shell
cd Plotline_Task
```

### Run

#### Environment Variables

```shell
touch .env
```

#### Run 
```shell
- Install `node.js` if not installed on your machine.
- Install `postman` if not installed on your machine
- Create a cluster in `MongoDBAtlas` if not made earlier
- Create two terminals access API using `http://localhost:3000` in one 
- Access API using `http://localhost:2999` in another
```

### Instruction for User 
```shell
- Step1 - Open postman
- Step2 - At first create an account using /post/add_user 
- Step3 - Login using /login
- Step4 - Use various cart api using /post/add_cart , /post/view_cart , /post/remove_item , /get/clear_cart
- Step5 - Generate the bill using /get/total_bill
- Step6 - Confirm the order using /get/confirm_order
```

### Instruction for Admin 
```shell
- Step1 - Open postman
- Step2 - Login using /admin/login
- Step3 - Generate the order reports using /admin/search
- Step4 - Add new item to the database using /admin/new_item
```

### The Complete Project Folder Structure

```
.
├── PLOTLY TASK
├── db
│   └── conn.js
├── model
│   ├── adminSchema.js
│   ├── itemSchema.js
│   ├── ordersSchema.js
│   └── userSchema.js
├── postman_api
│   └── PLOTLINE_TASK.postman_collection.json
├── router
│   └── auth.js
├── .gitignore
├── admin.js
├── config.env
├── main.js
└── README.md
```