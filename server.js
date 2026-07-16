const express = require("express");
const path = require("path");
require("dotenv").config();

const mongoose = require("mongoose");
const Expense = require("./models/Expense");

const app = express();

const PORT = process.env.PORT || 3000;


// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
.then(() => {
    console.log("MongoDB Connected");
})
.catch((err) => {
    console.log("MongoDB Connection Error:", err);
});


app.use(express.json());

app.use(express.static(path.join(__dirname, "public")));


// GET all expenses
app.get("/api/expenses", async (req, res) => {

    try {

        const expenses = await Expense.find();

        res.json({
            expenses
        });

    } catch(err) {

        res.status(500).json({
            error: "Database error"
        });

    }

});


// ADD expense
app.post("/api/expenses", async(req,res)=>{

    const exp = req.body;


    if(
        !exp ||
        !exp.desc ||
        !exp.amount ||
        exp.user_id === undefined ||
        exp.paidBy === undefined ||
        !Array.isArray(exp.splitAmong) ||
        exp.splitAmong.length === 0
    ){

        return res.status(400).json({
            error:"Galat ya adhoora data bheja gaya"
        });

    }


    try{

        const expense = await Expense.create(exp);


        res.json({
            ok:true,
            expense
        });


    }catch(err){

        res.status(500).json({
            error:"Database error"
        });

    }

});


// DELETE expense
app.delete("/api/expenses/:id/:user_id", async(req,res)=>{

    try{

        const expense = await Expense.findById(req.params.id);

        if(!expense){
            return res.status(404).json({
                error:"Expense nahi mila"
            });
        }


        // jis user ne create kiya wahi delete karega
        if(expense.user_id !== Number(req.params.user_id)){
            // console.log("User ID mismatch:", expense.user_id, req.params.user_id);
            return res.status(403).json({
                error:"Aap is expense ko delete nahi kar sakte"
            });
        }


        await Expense.findByIdAndDelete(req.params.id);


        res.json({
            ok:true
        });


    }catch(err){

        res.status(500).json({
            error:"Delete failed"
        });

    }

});



app.listen(PORT,()=>{

    console.log(`Ghar Ka Hisab running on port ${PORT}`);

});
