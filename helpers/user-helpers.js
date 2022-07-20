var db = require('../config/connection')
var collection = require("../config/collections")
const bcrypt = require('bcrypt')

const Razorpay = require('razorpay');
var instance = new Razorpay({
    key_id: 'rzp_test_PoxrGLdS9YdGPG',
    key_secret: 'MFolxmvFs9GTeXXdj7AgDk4H',
});
var objectid = require('mongodb').ObjectId
module.exports = {
    doSignUp: (userData) => {
        return new Promise(async (resolve, reject) => {
            userData.Password = await bcrypt.hash(userData.Password, 10)
            db.get().collection(collection.USER_COLLECTION).insertOne(userData).then((data) => {

                resolve(userData)
            })

        })

    },
    doLogin: (userData) => {

        let response = {

        }
        return new Promise(async (resolve, reject) => {
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ Email: userData.Email })

            if (user) {
                bcrypt.compare(userData.Password, user.Password).then((status) => {
                    if (status) {
                        console.log("Login Success");
                        response.user = user;
                        response.status = true;
                        resolve(response);
                    } else {
                        console.log("Login failed");
                        resolve({ status: false })

                    }

                })
            } else {
                console.log("login failed");
                resolve({ status: false })
            }



        })


    },
    addToCart: (proid, userid) => {
        let proObj = {
            item: objectid(proid),
            quantity: 1
        }
        return new Promise(async (resolve, reject) => {
            let userCart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectid(userid) });
            if (userCart) {
                let proExist = userCart.products.findIndex(product => product.item == proid);
                console.log(proExist);
                if (proExist != -1) {
                    db.get().collection(collection.CART_COLLECTION).updateOne({
                        user: objectid(userid), 'products.item': objectid(proid)
                    },
                        {
                            $inc: { 'products.$.quantity': 1 }
                        }).then((res) => {
                            resolve()
                        })
                } else {
                    db.get().collection(collection.CART_COLLECTION).updateOne({ user: objectid(userid) },
                        {

                            $push: {
                                products: proObj
                            }

                        }).then((res) => {
                            resolve();
                        })
                }
            } else {
                let cartobj = {
                    user: objectid(userid),
                    products: [proObj]
                }
                db.get().collection(collection.CART_COLLECTION).insertOne(cartobj).then((res) => {
                    resolve();
                })
            }
        })
    },
    getCartProducts: (userid) => {

        return new Promise(async (resolve, reject) => {
            let cartItems = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: objectid(userid) }
                }, {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }

                }, {
                    $project: {
                        item: 1, quantity: 1, product: {
                            $arrayElemAt: ['$product', 0]
                        }
                    }
                }


            ]).toArray()
            //    console.log(cartItems)
            resolve(cartItems);

        })
    },
    getCartCount: (userid) => {
        return new Promise(async (resolve, reject) => {
            let count = 0;
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectid(userid) })
            if (cart) {
                count = cart.products.length
            }
            resolve(count);
        })
    },
    changeProductQuantity: (data) => {
        data.count = parseInt(data.count);
        data.quantity = parseInt(data.quantity)
        return new Promise((resolve, reject) => {
            if (data.count == -1 && data.quantity == 1) {

                db.get().collection(collection.CART_COLLECTION).updateOne({
                    _id: objectid(data.cart)
                },
                    {
                        $pull: {
                            products: {
                                item: objectid(data.product)
                            }
                        }
                    }
                ).then((resp) => {
                    resolve({ removeproduct: true })
                })
            } else {
                db.get().collection(collection.CART_COLLECTION).updateOne({
                    _id: objectid(data.cart), 'products.item': objectid(data.product)
                },
                    {
                        $inc: { 'products.$.quantity': data.count }
                    }
                ).then((resp) => {
                    resolve({ status: true });
                })
            }

        }



        )
    },
    productRemove: (data) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.CART_COLLECTION).updateOne({
                _id: objectid(data.cartid)
            },
                {
                    $pull: {
                        products: {
                            item: objectid(data.productid)
                        }
                    }
                }
            ).then((resp) => {
                resolve({ removeproduct: true })
            })
        })
    },
    getTotalAmount: (userid) => {
        return new Promise(async (resolve, reject) => {

            let total = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: objectid(userid) }
                }, {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }

                }, {
                    $project: {
                        item: 1, quantity: 1, product: {
                            $arrayElemAt: ['$product', 0]
                        }
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: {
                            $sum: { $multiply: ['$quantity', { $toInt: '$product.Price' }] }
                        }
                    }


                }]).toArray()
            console.log(total)

            resolve(total[0].total);

        })


    },
    placeOrder: (order, products) => {
        return new Promise((resolve, reject) => {
            let status = order['payment-method'] === 'COD' ? 'placed' : 'pending';
            let orderObj = {
                deliverydetails: {
                    mobile: order.mobile,
                    address: order.address,
                    pincode: order.pincode

                },
                userid: objectid(order.user),
                paymentmethod: order['payment-method'],
                products: products,
                totalamount: order.total,
                date: new Date(),
                status: status
            }
            db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((res) => {
                db.get().collection(collection.CART_COLLECTION).deleteOne({ user: objectid(order.user) })
                resolve(res.insertedId);

            })
        })

    },
    getCartProductList: (userid) => {
        return new Promise(async (resolve, reject) => {
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectid(userid) })
            if (cart.products) {
                resolve(cart.products)
            } else {
                resolve();
            }


        })
    },
    getUserOrders: (userid) => {
        console.log(userid)
        return new Promise(async (resolve, reject) => {
            let orders = await db.get().collection(collection.ORDER_COLLECTION).find({ userid: objectid(userid) }).toArray()
            resolve(orders);
        })
    },
    getOrderProducts: (orderid) => {
        console.log(orderid);
        return new Promise(async (resolve, reject) => {
            let orderItems = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: { _id: objectid(orderid) }
                }, {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }

                }, {
                    $project: {
                        item: 1, quantity: 1, product: {
                            $arrayElemAt: ['$product', 0]
                        }
                    }
                }


            ]).toArray()


            resolve(orderItems)


        })

        // 
    },
    genarateRazorpay: (orderid, total) => {
        return new Promise((resolve, reject) => {
            var option = {
                amount: total*100,
                currency: "INR",
                receipt: "" + orderid
            }

            instance.orders.create(option, function (err, order) {
                if (err) {
                    console.log(err);

                }
                else {

                    resolve(order);
                }
            })
        })
    },
    varifyPayment: (details) => {
        return new Promise((resolve, resject) => {
            const crypto = require('crypto');
            let hmac = crypto.createHmac('sha256', 'MFolxmvFs9GTeXXdj7AgDk4H')
            hmac.update(details['payment[razorpay_order_id]'] + '|' + details['payment[razorpay_payment_id]'])
            hmac = hmac.digest('hex')
            if (hmac == details['payment[razorpay_signature]']) {
                resolve()
            } else {
                resject()
            }
        })

    },
    changePymentStaus: (orderid) => {
        console.log(orderid + "ajmala")
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id:objectid(orderid) },
                {
                    $set: {
                        status: "placed"
                    }
                }
            ).then((res) => {
                console.log("success placed")
                resolve()
            }).catch((err)=>{
                reject(err)
            })
        })
    }


}