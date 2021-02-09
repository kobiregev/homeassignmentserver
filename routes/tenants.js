const verifyUser = require('../verify')
const Tenant = require('../models/tenants');
const Address = require('../models/address');
const router = require('express').Router();

//get tenants
const getTenantsWithPegenation = async (sortParam = {}, page = 1, limit = 10) => {
    const tenants = await Tenant.find(sortParam)
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .populate('address','address') // populating to get address name(without the list of tenants).
        .exec();
    const count = !sortParam ? await Tenant.countDocuments() : await Tenant.where(sortParam).countDocuments();
    return {
        tenants,
        totalPages: Math.ceil(count / limit),
        currentPage: +page
    }
}

router.get('/', async (req, res) => {
    const { page = 1, limit = 5, sort = 'showAll' } = req.query;
    let sortParam;
    switch (sort) {
        case 'noDebt':
            sortParam = { debt: { $eq: 0 } };
            break;
        case 'debt':
            sortParam = { debt: { $gt: 0 } };
            break;
        default:
            sortParam = {};
    }
    try {
        const tenants = await getTenantsWithPegenation(sortParam, page, limit,)
        res.json(tenants)
    } catch (error) {
        console.log(error)
        res.sendStatus(500)
    }

})

router.get('/namesearch', async (req, res) => {
    const { name } = req.query
    if (name) {
        try {
            const tenant = await getTenantsWithPegenation({ name })
            res.json(tenant)
        } catch (error) {
            console.log(error)
            res.sendStatus(500)
        }
    } else {
        res.status(400).json({ error: true, msg: "Missing some info." })
    }
})

// create new tenant
router.post('/', async (req, res) => {
    const { name, phoneNumber, address, debt = 0 } = req.body
    // check that all required fields exists
    console.log(req.body)
    if (name && phoneNumber && address && debt >= 0) {
        try {
            const currAddress = await Address.findById(address)
            if (currAddress) {
                const newTenant = await new Tenant({ name, phoneNumber, address: currAddress._id, debt })
                currAddress.tenants.push(newTenant._id)
                await newTenant.save()
                await currAddress.save()
                res.status(201).json({ error: false, msg: "Tenant created successfully." })
            } else {
                res.status(400).json({ error: true, msg: "Couldnt find address." })
            }
        } catch (error) {
            res.sendStatus(500)
        }
    } else {
        res.status(400).json({ error: true, msg: "Missing some info." })
    }

})

// edit tenant
router.put('/', async (req, res) => {
    const { tenantId, name, phoneNumber, address, debt } = req.body
    if (tenantId) {
        try {
            const tenant = await Tenant.findById(tenantId)
            if (tenant) {
                tenant.name = name || tenant.name;
                tenant.phoneNumber = phoneNumber || tenant.phoneNumber;
                tenant.address = address || tenant.address;
                tenant.debt = debt >= 0 && debt || tenant.debt;
                await tenant.save();
                const tenants = await getTenantsWithPegenation()
                res.json(tenants)
            } else {
                res.status(400).json({ error: true, msg: "Couldn't find this tenant." })
            }
        } catch (error) {
            res.sendStatus(500)
        }
    } else {
        res.status(400).json({ error: true, msg: "Missing some info." })
    }
})

// delete tenant
router.delete('/', async (req, res) => {
    const { tenantId } = req.body
    if (tenantId) {
        try {
            const tenant = await Tenant.findById(tenantId)
            if (tenant) {
                //find the address
                const address = await Address.findById(tenant.address)

                //deleting the tenant from both address and tenant list
                await address.updateOne({ '$pull': { "tenants": tenantId } })
                await Tenant.deleteOne({ _id: tenantId })
                const tenants = await getTenantsWithPegenation()
                res.json(tenants)
            } else {
                res.status(400).json({ error: true, msg: "Couldn't find this tenant." })
            }
        } catch (error) {
            res.sendStatus(500)
        }
    } else {
        res.status(400).json({ error: true, msg: "Missing some info." })
    }
})

module.exports = router
// const tenants = await Tenant.find(sortParam)
        //     .limit(limit * 1)
        //     .skip((page - 1) * limit)
        //     .exec();
        // const count = !sortParam ? await Tenant.countDocuments() : await Tenant.where(sortParam).countDocuments();
        // res.json({
        //     tenants,
        //     totalPages: Math.ceil(count / limit),
        //     currentPage: page
        // })