const express = require('express');
const router = express.Router();
const { createCategory, getCategories, updateCategory, deleteCategory } = require('../controllers/category.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { categorySchema, updateCategorySchema } = require('../utils/validators');

router.use(authenticate);

router.post('/', validate(categorySchema), createCategory);
router.get('/', getCategories);
router.put('/:id', validate(updateCategorySchema), updateCategory);
router.delete('/:id', deleteCategory);

module.exports = router;
