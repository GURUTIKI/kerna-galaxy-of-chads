# How to Set Up MongoDB Atlas (Free Forever)

To save your players permanently, we need a cloud database. Follow these steps:

## Step 1: Create Account & Cluster
1.  Go to **[MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)** and sign up (free).
2.  Choose **"M0 Free"** tier.
3.  Provider: **AWS**, Region: **Frankfurt** (or closest to you).
4.  Click **"Create Deployment"**.

## Step 2: Create a Database User
1.  It will ask to "Create a database user".
2.  **Username**: `admin`
3.  **Password**: Give it a strong password (and **Write it down!**).
4.  Click **"Create Database User"**.

## Step 3: Network Access
1.  On the left menu, go to **Network Access**.
2.  Click **"Add IP Address"**.
3.  Choose **"Allow Access from Anywhere"** (0.0.0.0/0).
    *   *This is required because Render's IP address changes.*
4.  Click **"Confirm"**.

## Step 4: Get Connection String
1.  On the left, go back to **Database** (or "Clusters").
2.  Click **"Connect"**.
3.  Choose **"Drivers"**.
4.  You will see a string like: `mongodb+srv://admin:<password>@cluster0.abcde.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`
5.  **Copy this string**.
6.  **Replace `<password>`** with the password you created in Step 2.

## Step 5: Send it to me (or Add to Render)
You can paste the final string here, or add it to Render yourself:
1.  Go to Render Dashboard -> **Environment**.
2.  Add Variable:
    *   Key: `MONGODB_URI`
    *   Value: (Your connection string)



mongodb+srv://kerna:<db_password>@kerna-users.g5ffujj.mongodb.net/?appName=kerna-users

mongodb+srv://kerna:MUYak2Uc1R9OKFRS@kerna-users.g5ffujj.mongodb.net/?appName=kerna-users