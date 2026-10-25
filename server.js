const express = require("express");
const path = require("path");
require("dotenv").config();

const mongoose = require("mongoose");
const Expense = require("./models/Expense");

const app = express();

const PORT = process.env.PORT || 3000;


// Member model: id numbers kabhi reuse nahi hote, taaki purane expenses sahi rahein
const Member = mongoose.model("Member", new mongoose.Schema({
    id: { type: Number, required: true, unique: true },
    name: { type: String, required: true, trim: true, maxlength: 30 },
    active: { type: Boolean, default: true }
}));

// Pehli baar chalne par purane 4 log add ho jayenge (ids 0-3, bilkul pehle jaise)
async function seedMembers(){
    if (await Member.countDocuments() === 0){
        await Member.insertMany(
            ["Saurabh", "Rakesh", "Deepak", "Sunil"].map((name, i) => ({ id: i, name }))
        );
    }
}


// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
.then(async () => {
    console.log("MongoDB Connected");
    await seedMembers();
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

        // sirf active members hi payer ya split ka hissa ho sakte hain
        const activeIds = (await Member.find({ active: true })).map(m => m.id);
        const splitOk =
            exp.splitAmong.every(id => Number.isInteger(id) && activeIds.includes(id)) &&
            new Set(exp.splitAmong).size === exp.splitAmong.length;

        if (!splitOk || !activeIds.includes(exp.paidBy) || !(Number(exp.amount) > 0)){
            return res.status(400).json({
                error:"Galat member ya amount chuna gaya"
            });
        }

        const expense = await Expense.create({
            desc: String(exp.desc),
            amount: Number(exp.amount),
            user_id: exp.user_id,
            paidBy: exp.paidBy,
            splitAmong: exp.splitAmong
        });


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



// ---------- MEMBERS ----------

// GET all members (active + removed; removed wale purane ledger ke liye chahiye)
app.get("/api/members", async (req, res) => {
    try{
        const members = await Member.find().sort({ id: 1 }).select("id name active -_id").lean();
        res.json({ members });
    }catch(err){
        res.status(500).json({ error: "Database error" });
    }
});

// ADD member
app.post("/api/members", async (req, res) => {
    const name = String((req.body && req.body.name) || "").trim();

    if (!name || name.length > 30){
        return res.status(400).json({ error: "Naam 1 se 30 akshar ka hona chahiye" });
    }

    try{
        const all = await Member.find();
        const same = all.find(m => m.name.toLowerCase() === name.toLowerCase());

        if (same && same.active){
            return res.status(409).json({ error: "Ye naam pehle se hai" });
        }

        // pehle hataya hua banda wapas aaye to purana hisab wapas jud jata hai
        if (same){
            same.active = true;
            await same.save();
            return res.json({ ok: true });
        }

        const nextId = all.length ? Math.max(...all.map(m => m.id)) + 1 : 0;
        await Member.create({ id: nextId, name });
        res.json({ ok: true });
    }catch(err){
        res.status(500).json({ error: "Database error" });
    }
});

// REMOVE member (soft delete: expenses nahi hatate, sirf member inactive hota hai)
app.delete("/api/members/:id", async (req, res) => {
    try{
        const id = Number(req.params.id);
        const active = await Member.find({ active: true });

        if (active.length <= 2){
            return res.status(400).json({ error: "Kam se kam 2 members rehne chahiye" });
        }

        const member = active.find(m => m.id === id);
        if (!member){
            return res.status(404).json({ error: "Member nahi mila" });
        }

        member.active = false;
        await member.save();
        res.json({ ok: true });
    }catch(err){
        res.status(500).json({ error: "Remove failed" });
    }
});


app.listen(PORT,()=>{

    console.log(`Ghar Ka Hisab running on port ${PORT}`);

});
