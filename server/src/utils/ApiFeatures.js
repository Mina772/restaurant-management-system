/**
 * Fluent query builder for list endpoints.
 * Supports filtering, full-text-ish search, sorting, field limiting, pagination.
 *
 *   const features = new ApiFeatures(MenuItem.find(), req.query)
 *     .filter().search(['name','description']).sort().limitFields().paginate();
 *   const docs = await features.query;
 */
export default class ApiFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString || {};
    this.page = 1;
    this.limit = 12;
  }

  filter() {
    const q = { ...this.queryString };
    ['page', 'sort', 'limit', 'fields', 'search'].forEach((k) => delete q[k]);

    // gte|gt|lte|lt operators: ?price[gte]=10
    let str = JSON.stringify(q).replace(/\b(gte|gt|lte|lt|in)\b/g, (m) => `$${m}`);
    const parsed = JSON.parse(str);

    // Coerce comma-lists for $in
    Object.keys(parsed).forEach((key) => {
      if (parsed[key] && parsed[key].$in && typeof parsed[key].$in === 'string') {
        parsed[key].$in = parsed[key].$in.split(',');
      }
    });

    this.query = this.query.find(parsed);
    return this;
  }

  search(fields = []) {
    const term = this.queryString.search;
    if (term && fields.length) {
      const regex = new RegExp(term.trim(), 'i');
      this.query = this.query.find({ $or: fields.map((f) => ({ [f]: regex })) });
    }
    return this;
  }

  sort() {
    if (this.queryString.sort) {
      this.query = this.query.sort(this.queryString.sort.split(',').join(' '));
    } else {
      this.query = this.query.sort('-createdAt');
    }
    return this;
  }

  limitFields() {
    if (this.queryString.fields) {
      this.query = this.query.select(this.queryString.fields.split(',').join(' '));
    } else {
      this.query = this.query.select('-__v');
    }
    return this;
  }

  paginate() {
    this.page = Math.max(parseInt(this.queryString.page, 10) || 1, 1);
    this.limit = Math.min(Math.max(parseInt(this.queryString.limit, 10) || 12, 1), 100);
    const skip = (this.page - 1) * this.limit;
    this.query = this.query.skip(skip).limit(this.limit);
    return this;
  }
}
