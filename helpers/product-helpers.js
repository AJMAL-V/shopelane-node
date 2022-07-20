var db=require('../config/connection')
var collection=require("../config/collections")
var objectid =require('mongodb').ObjectId

module.exports={
    addproduct:(product,callback)=>{
      db.get().collection('product').insertOne(product).then((data)=>{
        callback(data.ops[0]._id);
      })
    },
    getAllProduct:()=>{
      return new Promise( async(resolve,reject)=>{
        let products= await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()
        resolve(products);
      })
    },
    deleteProduct:(productid)=>{
      return new Promise((resolve,reject)=>{
        db.get().collection(collection.PRODUCT_COLLECTION).deleteOne({_id:objectid(productid)}).then((res)=>{
          resolve(res);
        })
      }) 
    },
    getProductDetails:(productid)=>{
      return new Promise((resolve,reject)=>{
        db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id:objectid(productid)}).then((res)=>{
          resolve(res);
        })
      })
    },
    updateProduct:(productid,productDetails)=>{
      return new Promise((resolve,reject)=>{
        db.get().collection(collection.PRODUCT_COLLECTION).updateOne({_id:objectid(productid)},{
          $set:{
            Name:productDetails.Name,
            Description:productDetails.Description,
            Price:productDetails.Price,
            Category:productDetails.Category
          }
        }).then((res)=>{
          resolve(res);
        })
      })
    }
}